export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  uploaded_at: string;
  included: number;
  transaction_count: number;
  status: string;
  note: string | null;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  doc_id: string;
  date: string;
  description: string;
  merchant: string;
  amount: number;
  category: string;
  category_overridden: number;
}

export interface AuthedRequestUser {
  id: string;
  username: string;
  displayName: string;
}
