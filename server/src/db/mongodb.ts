import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(uri);

let database;

export async function connectDB() {
  if (database) return database;

  await client.connect();

  database = client.db(process.env.DB_NAME || "kumbara");

  console.log("✅ Connected to MongoDB Atlas");

  return database;
}

export function getDB() {
  if (!database) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }

  return database;
}