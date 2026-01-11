import { describe, it, expect, vi, beforeEach } from "vitest";
import { getQuizById, createQuiz, updateQuiz, deleteQuiz, getAllQuizzes } from "./quiz.server";
import * as dbServer from "./db.server";
import { ObjectId } from "mongodb";
import type { Quiz } from "~/types/quiz";

vi.mock("./db.server", () => ({
    getCollection: vi.fn(),
    ObjectId: vi.fn(function (id) { return { toString: () => id }; }),
}));

describe("quiz.server", () => {
    const mockDate = new Date("2024-01-01T00:00:00.000Z");
    
    beforeEach(() => {
        vi.clearAllMocks();
        vi.setSystemTime(mockDate);
    });

    const mockId = new ObjectId().toString();

    describe("getQuizById", () => {
        it("should return a quiz by id", async () => {
            const mockQuiz = { _id: mockId, title: "Test Quiz" };
            const mockCollection = {
                findOne: vi.fn().mockResolvedValue(mockQuiz),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const result = await getQuizById(mockId);

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: expect.anything() });
            expect(result).toEqual(mockQuiz);
        });

        it("should return null if not found", async () => {
            const mockCollection = {
                findOne: vi.fn().mockResolvedValue(null),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const result = await getQuizById(mockId);

            expect(result).toBeNull();
        });
    });

    describe("createQuiz", () => {
        it("should create a quiz", async () => {
            const mockQuizData: Omit<Quiz, "_id" | "createdAt" | "updatedAt"> = {
                title: "New Quiz",
                slug: "new-quiz",
                description: "Description",
                questions: [],
                isPublished: false,
                scoreRanges: []
            };

            const mockInsertedId = new ObjectId();
            const mockCollection = {
                insertOne: vi.fn().mockResolvedValue({ insertedId: mockInsertedId }),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const result = await createQuiz(mockQuizData);

            expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                title: "New Quiz",
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            }));
            expect(result).toEqual(mockInsertedId);
        });
    });

    describe("updateQuiz", () => {
        it("should update a quiz", async () => {
            const mockQuizData = {
                title: "Updated Quiz",
            };

            const mockCollection = {
                updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            await updateQuiz(mockId, mockQuizData);

            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { _id: expect.anything() },
                { $set: expect.objectContaining({ title: "Updated Quiz", updatedAt: expect.any(Date) }) }
            );
        });
    });

    describe("deleteQuiz", () => {
        it("should delete a quiz", async () => {
            const mockCollection = {
                deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const result = await deleteQuiz(mockId);

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: expect.anything() });
            expect(result).toBe(true);
        });
    });

    describe("getAllQuizzes", () => {
        it("should return all quizzes sorted", async () => {
            const mockQuizzes = [{ title: "Quiz 1" }, { title: "Quiz 2" }];
            const mockFindFn = {
                sort: vi.fn().mockReturnThis(),
                toArray: vi.fn().mockResolvedValue(mockQuizzes),
            };
            const mockCollection = {
                find: vi.fn().mockReturnValue(mockFindFn),
            };
            (dbServer.getCollection as any).mockResolvedValue(mockCollection);

            const result = await getAllQuizzes();

            expect(mockCollection.find).toHaveBeenCalledWith({});
            expect(mockFindFn.sort).toHaveBeenCalledWith({ order: 1, createdAt: -1 });
            expect(result).toEqual(mockQuizzes);
        });
    });
});
