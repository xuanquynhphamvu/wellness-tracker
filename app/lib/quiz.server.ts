import { ObjectId } from "mongodb";
import { getCollection } from "./db.server";
import type { Quiz } from "~/types/quiz";

export async function getQuizById(id: string) {
    if (!ObjectId.isValid(id)) return null;
    const quizzes = await getCollection<Quiz>("quizzes");
    return quizzes.findOne({ _id: new ObjectId(id) });
}

export async function createQuiz(data: Omit<Quiz, "_id" | "createdAt" | "updatedAt">) {
    const quizzes = await getCollection<Quiz>("quizzes");
    const now = new Date();
    // MongoDB adds _id, and we set dates
    const result = await quizzes.insertOne({
        ...data,
        createdAt: now,
        updatedAt: now,
    } as any); 
    return result.insertedId;
}

export async function updateQuiz(id: string, data: Partial<Omit<Quiz, "_id" | "createdAt" | "updatedAt">>) {
    if (!ObjectId.isValid(id)) return false;
    const quizzes = await getCollection<Quiz>("quizzes");
    const result = await quizzes.updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                ...data,
                updatedAt: new Date(),
            },
        }
    );
    return result.modifiedCount > 0;
}

export async function deleteQuiz(id: string) {
    if (!ObjectId.isValid(id)) return false;
    const quizzes = await getCollection<Quiz>("quizzes");
    const result = await quizzes.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
}

export async function getAllQuizzes(query: Record<string, any> = {}) {
    const quizzes = await getCollection<Quiz>("quizzes");
    return quizzes.find(query).sort({ order: 1, createdAt: -1 }).toArray();
}
