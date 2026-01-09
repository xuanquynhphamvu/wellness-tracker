
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

async function checkImages() {
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/wellness-tracker");
    await client.connect();
    const db = client.db();
    const quizzes = await db.collection("quizzes").find({}).toArray();

    console.log("--- DEBUG QUIZ IMAGES ---");
    quizzes.forEach(q => {
        console.log(`Quiz: ${q.title}`);
        console.log(`CoverImage: '${q.coverImage}'`);
        console.log("-------------------------");
    });

    await client.close();
}

checkImages().catch(console.error);
