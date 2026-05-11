import { getDatabase } from "@/lib/mongodb";
import type { Db, Collection } from "mongodb";

const DB_NAME = "sample_mflix";

/**
 * Get the sample_mflix database connection
 */
export async function getMflixDatabase(): Promise<Db> {
  return getDatabase(DB_NAME);
}

/**
 * Get a specific collection from sample_mflix database
 */
export async function getMflixCollection(
  collectionName: string
): Promise<Collection> {
  const db = await getMflixDatabase();
  return db.collection(collectionName);
}

/**
 * Get Categories collection
 */
export async function getCategoriesCollection(): Promise<Collection> {
  return getMflixCollection("Categories");
}


/**
 * Verify connection to sample_mflix database
 */
export async function verifyMflixConnection(): Promise<boolean> {
  try {
    const db = await getMflixDatabase();
    await db.command({ ping: 1 });
    return true;
  } catch (error) {
    console.error("Failed to connect to sample_mflix:", error);
    return false;
  }
}
