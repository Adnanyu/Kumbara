export type Category =
  | "Shopping"
  | "Grocery"
  | "Gaming"
  | "Beauty"
  | "Gas"
  | "Subscriptions"
  | "Insurance"
  | "Dining"
  | "Transport"
  | "Utilities"
  | "Health"
  | "Entertainment"
  | "Housing"
  | "Transfers"
  | "Income"
  | "Other";

export interface Document {
  id: string;
  name: string;
  type: "csv" | "xlsx" | "pdf";
  uploadedAt: string;
  included: boolean;
  transactionCount: number;
  status: "ready" | "issue";
  note?: string;
}

export interface Transaction {
  id: string;
  docId: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  merchant: string;
  amount: number; // negative = expense, positive = income
  category: Category;
  categoryOverridden?: boolean;
  isAnomaly?: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
}

export interface Filters {
  start: string | null;
  end: string | null;
  categories: Category[];
  minAmount: number | null;
  maxAmount: number | null;
  search: string;
}

export const CATEGORIES: Category[] = [
  "Shopping",
  "Grocery",
  "Gaming",
  "Beauty",
  "Gas",
  "Subscriptions",
  "Insurance",
  "Dining",
  "Transport",
  "Utilities",
  "Health",
  "Entertainment",
  "Housing",
  "Transfers",
  "Income",
  "Other",
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Shopping: "#C97F2A",
  Grocery: "#2F6F5E",
  Gaming: "#6C5CE7",
  Beauty: "#D97E9C",
  Gas: "#8D6E4F",
  Subscriptions: "#3A7BC9",
  Insurance: "#4B5B6B",
  Dining: "#B23A48",
  Transport: "#1F9E9E",
  Utilities: "#7A8B99",
  Health: "#3E9B5C",
  Entertainment: "#A6472F",
  Housing: "#5C4B8A",
  Transfers: "#7C8CC4",
  Income: "#2F6F5E",
  Other: "#9AA3AC",
};