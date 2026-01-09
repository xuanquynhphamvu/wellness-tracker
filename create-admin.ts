
import { MongoClient, ServerApiVersion } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("Please set MONGODB_URI in .env or pass it as an environment variable.");
    process.exit(1);
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const email = 'admin@wellness.com';
        const password = 'admin'; // Temporary password
        const hashedPassword = await bcrypt.hash(password, 10);

        await client.connect();
        const db = client.db('wellness-tracker');

        // Upsert admin user
        const result = await db.collection('users').updateOne(
            { email },
            {
                $set: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'admin',
                    name: 'Admin User',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        console.log(`✅ Admin user upserted: ${email} / ${password}`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
run().catch(console.dir);
