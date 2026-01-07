import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

/**
 * MongoDB Database Connection Singleton
 * 
 * WHY THIS FILE EXISTS:
 * - Manages a single MongoDB connection across your entire app
 * - Prevents connection leaks (opening too many connections)
 * - The `.server.ts` suffix ensures this code NEVER ships to the browser
 * 
 * EXECUTION CONTEXT: SERVER ONLY
 * - This file runs in Node.js (loaders/actions)
 * - Never imported in React components
 * - Tree-shaken from client bundle automatically
 */

// Singleton pattern: one client instance for the entire app
let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Get MongoDB connection
 * Creates connection on first call, reuses it afterwards
 */
export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is not set. ' +
      'Create a .env file with: MONGODB_URI=mongodb://localhost:27017/wellness-tracker'
    );
  }

  client = new MongoClient(uri);
  await client.connect();
  
  // Extract database name from URI or use default
  const dbName = uri.split('/').pop()?.split('?')[0] || 'wellness-tracker';
  db = client.db(dbName);

  console.log(`✅ Connected to MongoDB database: ${dbName}`);
  
  return db;
}

/**
 * Get a typed MongoDB collection
 * 
 * USAGE:
 * const quizzes = await getCollection<Quiz>('quizzes');
 * const quiz = await quizzes.findOne({ _id: new ObjectId(id) });
 * 
 * @param collectionName - Name of the collection
 * @returns Typed MongoDB collection
 */
export async function getCollection<T extends { _id?: ObjectId }>(
  collectionName: string
): Promise<Collection<T>> {
  const database = await getDb();
  return database.collection<T>(collectionName);
}

/**
 * Close MongoDB connection
 * Typically called during server shutdown
 */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 MongoDB connection closed');
  }
}

// Export ObjectId for convenience
export { ObjectId };
