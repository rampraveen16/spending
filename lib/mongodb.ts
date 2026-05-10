import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI ?? process.env.spending_MONGODB_URI;

if (!uri) {
  throw new Error(
    "Missing MongoDB connection string. Set MONGODB_URI or spending_MONGODB_URI in .env."
  );
}

const options = {};

declare global {
  // Reuse a single client in development to avoid exhausting connections on hot reload.
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri, options);

const clientPromise = global._mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  global._mongoClientPromise = clientPromise;
}

export async function getDatabase(dbName?: string): Promise<Db> {
  const connectedClient = await clientPromise;
  const resolvedDbName = dbName ?? process.env.MONGODB_DB;
  return resolvedDbName ? connectedClient.db(resolvedDbName) : connectedClient.db();
}
