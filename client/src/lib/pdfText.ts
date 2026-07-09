import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfPageLines {
  page: number;
  lines: string[];
}

/**
 * Groups a page's text items into visual lines using their y-coordinate,
 * then joins each line's items in reading (x) order. Works well for
 * text-based PDFs; returns empty/sparse output for scanned or
 * image-rendered statements (those need OCR — see ocr.ts).
 */
export async function extractTextLayer(file: File): Promise<{ pages: PdfPageLines[]; fullText: string }> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: PdfPageLines[] = [];
  let fullText = "";

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    type Item = { str: string; transform: number[] };
    const items = content.items as Item[];

    // Group items into lines by rounding y to the nearest few px.
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of items) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      const x = item.transform[4];
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, str: item.str });
    }

    const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a); // top to bottom
    const lines = sortedYs.map((y) =>
      rows
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    );

    pages.push({ page: p, lines: lines.filter(Boolean) });
    fullText += lines.join("\n") + "\n";
  }

  return { pages, fullText };
}

export async function getPdfPageCount(file: File): Promise<number> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  return doc.numPages;
}

/** Renders each page to a PNG data URL at a resolution good for OCR. */
export async function renderPagesToImages(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const images: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    onProgress?.(p, doc.numPages);
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 2.2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable in this browser.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL("image/png"));
  }
  return images;
}
