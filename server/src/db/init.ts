import { connectDB } from "./mongodb.js";

export async function initDatabase() {
  const db = await connectDB();

  // Create collections if they don't exist

  const collections = await db.listCollections().toArray();

  const names = collections.map((c) => c.name);

  if (!names.includes("users")) {
    await db.createCollection("users");
  }

  if (!names.includes("documents")) {
    await db.createCollection("documents");
  }

  if (!names.includes("transactions")) {
    await db.createCollection("transactions");
  }

  // Users

  await db.collection("users").createIndex(
    { username: 1 },
    { unique: true }
  );

  // Documents

  await db.collection("documents").createIndex({
    user_id: 1
  });

  // Transactions

  await db.collection("transactions").createIndex({
    user_id: 1
  });

  await db.collection("transactions").createIndex({
    doc_id: 1
  });

  console.log("✅ MongoDB initialized");
}