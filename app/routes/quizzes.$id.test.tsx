import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader, action } from "./quizzes.$id";
import { ObjectId } from "mongodb";
import * as dbServer from "~/lib/db.server";
import * as authServer from "~/lib/auth.server";
import { redirect } from "react-router";

// Mock dependencies
vi.mock("~/lib/db.server", async () => {
    const actual = await vi.importActual("~/lib/db.server");
    return {
        ...actual,
        getCollection: vi.fn(),
    };
});
vi.mock("~/lib/auth.server");

describe("Quiz Route (quizzes.$id)", () => {
    const mockUser = { _id: new ObjectId().toString(), email: "test@example.com", role: "user" };
    const mockQuizId = new ObjectId();
    const mockQuiz = {
        _id: mockQuizId,
        title: "Test Quiz",
        description: "Test",
        questions: [
            { id: "q1", text: "Q1", type: "scale", scaleMin: 1, scaleMax: 5, scoreMapping: { "5": 5 } }
        ],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        scoreRanges: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mocks
        (authServer.requireUser as any).mockResolvedValue(mockUser);
        (dbServer.getCollection as any).mockResolvedValue({
            findOne: vi.fn().mockResolvedValue(mockQuiz),
            insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() })
        });
    });

    describe("loader", () => {
        it("should return serialized quiz data", async () => {
            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId);
            const params = { id: mockQuizId.toString() };

            const response = await loader({ request, params, context: {} } as any);

            expect(response.quiz).toBeDefined();
            expect(response.quiz._id).toBe(mockQuizId.toString());
            expect(response.quiz.title).toBe(mockQuiz.title);
        });

        it("should throw 400 if ID is missing", async () => {
            const request = new Request("http://localhost:3000/quizzes");
            const params = {};

            try {
                await loader({ request, params, context: {} } as any);
            } catch (error: any) {
                expect(error).toBeInstanceOf(Response);
                expect(error.status).toBe(400);
            }
        });

        it("should throw 404 if quiz not found", async () => {
            (dbServer.getCollection as any).mockResolvedValue({
                findOne: vi.fn().mockResolvedValue(null)
            });

            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId);
            const params = { id: mockQuizId.toString() };

            try {
                await loader({ request, params, context: {} } as any);
            } catch (error: any) {
                expect(error).toBeInstanceOf(Response);
                expect(error.status).toBe(404);
            }
        });
    });

    describe("action", () => {
        it("should calculate score and redirect on success", async () => {
            const formData = new FormData();
            formData.append("question_q1", "5");

            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId, {
                method: "POST",
                body: formData
            });
            const params = { id: mockQuizId.toString() };
            const insertOneMock = vi.fn().mockResolvedValue({ insertedId: new ObjectId() });

            (dbServer.getCollection as any).mockImplementation(async (name: string) => {
                if (name === 'quizzes') return { findOne: vi.fn().mockResolvedValue(mockQuiz) };
                if (name === 'results') return { insertOne: insertOneMock };
                return {};
            });

            const response = await action({ request, params, context: {} } as any);

            expect(insertOneMock).toHaveBeenCalledWith(expect.objectContaining({
                userId: new ObjectId(mockUser._id),
                quizId: new ObjectId(mockQuizId),
                score: 5
            }));

            // Verify redirect
            expect(response.status).toBe(302);
            expect(response.headers.get("Location")).toContain("/results/");
        });

        it("should throw 404 if quiz not found during submission", async () => {
            (dbServer.getCollection as any).mockImplementation(async (name: string) => {
                if (name === 'quizzes') return { findOne: vi.fn().mockResolvedValue(null) };
                return {};
            });

            const formData = new FormData();
            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId, {
                method: "POST",
                body: formData
            });
            const params = { id: mockQuizId.toString() };

            try {
                await action({ request, params, context: {} } as any);
            } catch (error: any) {
                expect(error).toBeInstanceOf(Response);
                expect(error.status).toBe(404);
            }
        });
    });
});
