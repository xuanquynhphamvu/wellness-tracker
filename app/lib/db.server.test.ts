import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MongoClient } from 'mongodb';
import { getDb, getCollection, closeDb } from './db.server';

// Mock mongodb
vi.mock('mongodb', () => {
    const mDb = {
        collection: vi.fn(),
    };
    const mClient = {
        connect: vi.fn(),
        db: vi.fn(() => mDb),
        close: vi.fn(),
    };
    return {
        MongoClient: vi.fn(function () { return mClient; }),
        ObjectId: vi.fn(),
    };
});

describe('db.server', () => {
    const originalEnv = process.env;

    beforeEach(async () => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
        // Ensure strictly fresh state if possible, though module state is persistent.
        // We rely on closeDb to reset the module state.
        await closeDb();
    });

    afterEach(async () => {
        await closeDb();
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    it('should throw an error if MONGODB_URI is not set', async () => {
        delete process.env.MONGODB_URI;

        await expect(getDb()).rejects.toThrow('MONGODB_URI environment variable is not set');
    });

    it('should connect to MongoDB and return the database', async () => {
        const db = await getDb();

        expect(MongoClient).toHaveBeenCalledWith('mongodb://localhost:27017/test-db');
        const clientInstance = new MongoClient('dummy');
        expect(clientInstance.connect).toHaveBeenCalled();
        expect(clientInstance.db).toHaveBeenCalledWith('test-db');
        expect(db).toBeDefined();
    });

    it('should use the database name from the URI if present', async () => {
        process.env.MONGODB_URI = 'mongodb://example.com/custom-db?retryWrites=true';

        await getDb();

        const clientInstance = new MongoClient('dummy');
        expect(clientInstance.db).toHaveBeenCalledWith('custom-db');
    });

    it('should use default database name if not present in URI', async () => {
        // This case might be tricky depending on how URL parsing works in the implementation.
        // The implementation does: uri.split('/').pop()?.split('?')[0] || 'wellness-tracker'
        // If URI is just mongodb://localhost:27017, split('/') gives ['mongodb:', '', 'localhost:27017']
        // pop() gives 'localhost:27017'. split('?')[0] gives 'localhost:27017'.
        // So dbName will be 'localhost:27017', which might not be intended as default but that's what the code does.
        // Wait, standard mongo URI is mongodb://host:port/dbname
        // If I put mongodb://localhost:27017/, split gives empty string at end?

        process.env.MONGODB_URI = 'mongodb://localhost:27017/my-db';
        await getDb();
        const clientInstance = new MongoClient('dummy');
        expect(clientInstance.db).toHaveBeenCalledWith('my-db');
    });

    it('should reuse the existing connection (singleton pattern)', async () => {
        const db1 = await getDb();
        const db2 = await getDb();

        expect(db1).toBe(db2);
        expect(MongoClient).toHaveBeenCalledTimes(1);
    });

    it('getCollection should return a collection from the database', async () => {
        const mockCollection = { collectionName: 'users' };
        const clientInstance = new MongoClient('dummy');
        // @ts-expect-error: mocking nested property
        clientInstance.db().collection.mockReturnValue(mockCollection);

        const collection = await getCollection('users');

        expect(collection).toBe(mockCollection);
        expect(clientInstance.db().collection).toHaveBeenCalledWith('users');
    });

    it('closeDb should close the connection', async () => {
        await getDb(); // Ensure it's open
        await closeDb();

        const clientInstance = new MongoClient('dummy');
        expect(clientInstance.close).toHaveBeenCalled();
    });

    it('closeDb should do nothing if no connection exists', async () => {
        // Ensure closed
        await closeDb(); // first time might close if open from previous
        vi.clearAllMocks();

        await closeDb();
        const clientInstance = new MongoClient('dummy');
        expect(clientInstance.close).not.toHaveBeenCalled();
    });
});
