import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Document, Transaction, User, Category } from "@/lib/types";
import { apiFetch, getToken, setToken } from "@/lib/api";
import { fetchCurrentUser } from "@/lib/auth";

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  documents: Document[];
  transactions: Transaction[];
  loadingData: boolean;
  setSession: (user: User | null) => void;
  logout: () => void;
  addDocument: (
    doc: { name: string; type: Document["type"]; note?: string },
    txns: Omit<Transaction, "id" | "docId">[]
  ) => Promise<void>;
  toggleDocument: (docId: string, included: boolean) => Promise<void>;
  removeDocument: (docId: string) => Promise<void>;
  updateTransactionCategory: (txnId: string, category: Category) => Promise<void>;
  includedTransactions: Transaction[];
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        const stored = await fetchCurrentUser();
        if (stored) setUser(stored);
        else setToken(null);
      }
      setAuthLoading(false);
    })();
  }, []);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [docsRes, txnsRes] = await Promise.all([
        apiFetch<{ documents: Document[] }>("/api/documents"),
        apiFetch<{ transactions: Transaction[] }>("/api/transactions"),
      ]);
      setDocuments(docsRes.documents);
      setTransactions(txnsRes.transactions);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setTransactions([]);
      return;
    }
    loadData();
  }, [user, loadData]);

  const setSession = useCallback((u: User | null) => {
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const addDocument = useCallback(
    async (
      doc: { name: string; type: Document["type"]; note?: string },
      txns: Omit<Transaction, "id" | "docId">[]
    ) => {
      await apiFetch("/api/documents", {
        method: "POST",
        body: JSON.stringify({ ...doc, transactions: txns }),
      });
      await loadData();
    },
    [loadData]
  );

  const toggleDocument = useCallback(async (docId: string, included: boolean) => {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, included } : d)));
    await apiFetch(`/api/documents/${docId}`, {
      method: "PATCH",
      body: JSON.stringify({ included }),
    });
  }, []);

  const removeDocument = useCallback(async (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setTransactions((prev) => prev.filter((t) => t.docId !== docId));
    await apiFetch(`/api/documents/${docId}`, { method: "DELETE" });
  }, []);

  const updateTransactionCategory = useCallback(async (txnId: string, category: Category) => {
    setTransactions((prev) => prev.map((t) => (t.id === txnId ? { ...t, category, categoryOverridden: true } : t)));
    await apiFetch(`/api/transactions/${txnId}`, {
      method: "PATCH",
      body: JSON.stringify({ category }),
    });
  }, []);

  const includedDocIds = new Set(documents.filter((d) => d.included).map((d) => d.id));
  const includedTransactions = transactions.filter((t) => includedDocIds.has(t.docId));

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        documents,
        transactions,
        loadingData,
        setSession,
        logout,
        addDocument,
        toggleDocument,
        removeDocument,
        updateTransactionCategory,
        includedTransactions,
        refresh: loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
