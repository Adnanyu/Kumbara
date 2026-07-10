import { getDB } from "./mongodb.js";
import type {
  UserDocument,
  DocumentDocument,
  TransactionDocument,
} from "../types.js";

export const Users = () =>
  getDB().collection<UserDocument>("users");

export const Documents = () =>
  getDB().collection<DocumentDocument>("documents");

export const Transactions = () =>
  getDB().collection<TransactionDocument>("transactions");