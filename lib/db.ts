import { MongoClient, type Db } from "mongodb";

/**
 * Normalize DATABASE_URL for MongoDB driver:
 * 1. Inject database name "growith-arm" if path is missing.
 * 2. Add authSource=admin only when not present (so Coolify URLs work unchanged).
 */
function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL ?? "";
  if (!url) return url;
  if (url.includes("/?")) url = url.replace("/?", "/growith-arm?");
  else if (url.match(/:\d+\/?$/)) url = url.replace(/(:\d+)\/?$/, "$1/growith-arm");
  if (!url.includes("authSource=")) url += url.includes("?") ? "&authSource=admin" : "?authSource=admin";
  return url;
}

const globalForMongo = globalThis as unknown as { mongoClient: MongoClient };

async function getMongoClient(): Promise<MongoClient> {
  if (globalForMongo.mongoClient) return globalForMongo.mongoClient;
  const url = getDatabaseUrl();
  const client = new MongoClient(url);
  globalForMongo.mongoClient = client;
  return client;
}

const DB_NAME = "growith-arm";

/** Returns the MongoDB database. Use in server code (pages, actions, API routes). */
export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}
