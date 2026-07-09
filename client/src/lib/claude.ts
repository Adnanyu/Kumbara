import type { Transaction } from "./types";
import { categoryTotals, monthlyTotals, overallStats, topMerchants, categoryTrends, detectAnomalies } from "./analytics";
import { apiFetch, ApiError } from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildFinancialContext(txns: Transaction[]) {
  const stats = overallStats(txns);
  const cats = categoryTotals(txns).slice(0, 10);
  const months = monthlyTotals(txns).slice(-6);
  const merchants = topMerchants(txns, 6);
  const trends = categoryTrends(txns).slice(0, 6);
  const anomalies = detectAnomalies(txns).slice(0, 5);

  return {
    summary: stats,
    spendingByCategory: cats,
    monthlySpend: months,
    topMerchants: merchants,
    categoryTrendsVsPriorMonth: trends,
    recentAnomalies: anomalies.map((a) => ({ date: a.date, merchant: a.merchant, category: a.category, amount: a.amount })),
  };
}

export async function askFinanceAssistant(
  question: string,
  txns: Transaction[],
  history: ChatMessage[]
): Promise<string> {
  const context = buildFinancialContext(txns);
  try {
    const { reply } = await apiFetch<{ reply: string }>("/api/assistant", {
      method: "POST",
      body: JSON.stringify({ question, context, history }),
    });
    return reply;
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw new Error("The assistant couldn't respond just now. Please try again.");
  }
}
