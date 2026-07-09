import { createWorker } from "tesseract.js";
import { renderPagesToImages } from "./pdfText";

/**
 * Runs OCR over every page of a PDF that has no usable text layer (i.e. the
 * statement table was rendered as an image by the bank's PDF generator —
 * common for Chase and several other banks). All model assets are served
 * from this app's own /public folder, not a third-party CDN, so statement
 * images never leave the browser.
 */
export async function ocrPdfPages(
  file: File,
  onProgress?: (page: number, total: number, stage: "rendering" | "reading") => void
): Promise<string[]> {
  const images = await renderPagesToImages(file, (page, total) => onProgress?.(page, total, "rendering"));

  const worker = await createWorker("eng", 1, {
    workerPath: "/vendor/tesseract/worker.min.js",
    corePath: "/vendor/tesseract/tesseract-core-lstm.wasm.js",
    langPath: "/tessdata",
    gzip: true,
  });

  try {
    const texts: string[] = [];
    for (let i = 0; i < images.length; i++) {
      onProgress?.(i + 1, images.length, "reading");
      const { data } = await worker.recognize(images[i]);
      texts.push(data.text);
    }
    return texts;
  } finally {
    await worker.terminate();
  }
}
