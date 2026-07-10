export interface UserDocument {
  _id: string;
  username: string;
  usernameLower: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

export interface DocumentDocument {
  _id: string;
  userId: string;
  name: string;
  type: "csv" | "xlsx" | "pdf";
  uploadedAt: string;
  included: boolean;
  transactionCount: number;
  status: "ready" | "issue";
  note: string | null;
}

export interface TransactionDocument {
  _id: string;
  userId: string;
  docId: string;
  date: string;
  description: string;
  merchant: string;
  amount: number;
  category: string;
  categoryOverridden: boolean;
}

export interface AuthedRequestUser {
  id: string;
  username: string;
  displayName: string;
}
