import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { loader } from "./results.$id";
import { ObjectId } from "mongodb";
import * as dbServer from "~/lib/db.server";
import * as authServer from "~/lib/auth.server";
import type { Route } from "./+types/results.$id";

// Mock dependencies
vi.mock("~/lib/db.server", async () => {
    const actual = await vi.importActual("~/lib/db.server");
    return {
        ...actual,
        getCollection: vi.fn(),
    };
});
vi.mock("~/lib/auth.server");

describe("Results Route (results.$id)", () => {
    const mockUser = { _id: new ObjectId().toString(), email: "test@example.com", role: "user" };
    const mockResultId = new ObjectId();
    const mockQuizId = new ObjectId();

    // Result belonging to mockUser
    const mockResult = {
        _id: mockResultId,
        quizId: mockQuizId,
        userId: new ObjectId(mockUser._id),
        score: 10,
        answers: [],
        completedAt: new Date()
    };

    const mockQuiz = {
        _id: mockQuizId,
        title: "Test Quiz",
        description: "Test",
        questions: [],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mocks
        (authServer.requireUser as unknown as Mock).mockResolvedValue(mockUser);
        (dbServer.getCollection as unknown as Mock).mockImplementation(async (name: string) => {
            if (name === 'results') return { findOne: vi.fn().mockResolvedValue(mockResult) };
            if (name === 'quizzes') return { findOne: vi.fn().mockResolvedValue(mockQuiz) };
            return {};
        });
    });

    describe("loader", () => {
        it("should return serialized result and quiz data", async () => {
            const request = new Request("http://localhost:3000/results/" + mockResultId);
            const params = { id: mockResultId.toString() };

            const response = await loader({ request, params, context: {} } as Route.LoaderArgs);

            expect(response.result._id).toBe(mockResultId.toString());
            expect(response.quiz._id).toBe(mockQuizId.toString());
        });

        it("should throw 400 if ID is missing", async () => {
            const request = new Request("http://localhost:3000/results");
            const params = {};

            try {
                await loader({ request, params, context: {} } as unknown as Route.LoaderArgs);
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(400);
                }
            }
        });

        it("should throw 404 if result not found", async () => {
            (dbServer.getCollection as unknown as Mock).mockImplementation(async (name: string) => {
                if (name === 'results') return { findOne: vi.fn().mockResolvedValue(null) };
                return {};
            });

            const request = new Request("http://localhost:3000/results/" + mockResultId);
            const params = { id: mockResultId.toString() };

            try {
                await loader({ request, params, context: {} } as Route.LoaderArgs);
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(404);
                }
            }
        });

        it("should throw 403 if user does not own result", async () => {
            const otherUserId = new ObjectId();
            const otherUserResult = { ...mockResult, userId: otherUserId };

            (dbServer.getCollection as unknown as Mock).mockImplementation(async (name: string) => {
                if (name === 'results') return { findOne: vi.fn().mockResolvedValue(otherUserResult) };
                return {};
            });

            const request = new Request("http://localhost:3000/results/" + mockResultId);
            const params = { id: mockResultId.toString() };

            try {
                await loader({ request, params, context: {} } as Route.LoaderArgs);
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(403);
                }
            }
        });

        it("should throw 404 if linked quiz not found", async () => {
            (dbServer.getCollection as unknown as Mock).mockImplementation(async (name: string) => {
                if (name === 'results') return { findOne: vi.fn().mockResolvedValue(mockResult) };
                if (name === 'quizzes') return { findOne: vi.fn().mockResolvedValue(null) }; // Quiz missing
                return {};
            });

            const request = new Request("http://localhost:3000/results/" + mockResultId);
            const params = { id: mockResultId.toString() };

            try {
                await loader({ request, params, context: {} } as Route.LoaderArgs);
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(404);
                }
            }
        });
    });
});

