import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loader } from "./results.$id";
import Results from "./results.$id";
import { ObjectId, type Collection } from "mongodb";
import * as dbServer from "~/lib/db.server";
import * as authServer from "~/lib/auth.server";
import type { Route } from "./+types/results.$id";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { QuizResult } from "~/types/result";
import type { Quiz, SerializedQuiz } from "~/types/quiz";
import type { SerializedUser } from "~/types/user";
import React from "react";

// Mock dependencies
vi.mock("~/lib/db.server", async () => {
    const actual = await vi.importActual("~/lib/db.server");
    return {
        ...actual,
        getCollection: vi.fn(),
    };
});
vi.mock("~/lib/auth.server");

// Mock scroll since jsdom doesn't support it
window.scrollTo = vi.fn();

describe("Results Route (results.$id)", () => {
    // Correctly typed as SerializedUser since that's what requireUser returns
    const mockUser: SerializedUser = { 
        _id: new ObjectId().toString(), 
        email: "test@example.com", 
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const mockResultId = new ObjectId();
    const mockQuizId = new ObjectId();

    // Result object matching QuizResult from DB
    const mockResult: QuizResult = {
        _id: mockResultId,
        quizId: mockQuizId,
        userId: new ObjectId(mockUser._id),
        sessionId: "test-session",
        score: 10,
        answers: [],
        completedAt: new Date()
    };

    const mockQuiz: Quiz = {
        _id: mockQuizId,
        title: "Test Quiz",
        slug: "test-quiz",
        description: "Test",
        questions: [
           { id: "q1", text: "Q1", type: "scale", scaleMin: 1, scaleMax: 5 }
        ],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        scoreRanges: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mocks
        vi.mocked(authServer.requireUser).mockResolvedValue(mockUser);
        
        vi.mocked(dbServer.getCollection).mockImplementation(async (name: string) => {
            if (name === 'results') {
                return { 
                    findOne: vi.fn().mockResolvedValue(mockResult) 
                } as unknown as Collection<{ _id?: ObjectId }>;
            }
            if (name === 'quizzes') {
                return { 
                    findOne: vi.fn().mockResolvedValue(mockQuiz) 
                } as unknown as Collection<{ _id?: ObjectId }>;
            }
            throw new Error(`Unexpected collection: ${name}`);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("loader", () => {
        it("should return serialized result and quiz data", async () => {
            const request = new Request("http://localhost:3000/results/" + mockResultId);
            const params = { id: mockResultId.toString() };

            const response = await loader({ request, params, context: {} } as Route.LoaderArgs);

            expect(response.result._id).toBe(mockResultId.toString());
            expect(response.quiz._id).toBe(mockQuizId.toString());
            expect(response.result.sessionId).toBe("test-session");
        });

        it("should throw 400 if ID is missing", async () => {
            const request = new Request("http://localhost:3000/results");
            const params = {};

            try {
                // Using Route.LoaderArgs normally
                await loader({ request, params, context: {} } as Route.LoaderArgs);
                expect.fail("Should have thrown error");
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(400);
                }
            }
        });

        it("should throw 404 if result not found", async () => {
            vi.mocked(dbServer.getCollection).mockImplementation(async (name: string) => {
                // Just use generic Collection type satisfying constraints
                 if (name === 'results') {
                     return { findOne: vi.fn().mockResolvedValue(null) } as unknown as Collection<{ _id?: ObjectId }>;
                 }
                return {} as unknown as Collection<{ _id?: ObjectId }>;
            });

            const request = new Request("http://localhost:3000/results/" + mockResultId);
            const params = { id: mockResultId.toString() };

            try {
                await loader({ request, params, context: {} } as Route.LoaderArgs);
                expect.fail("Should have thrown error");
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

            vi.mocked(dbServer.getCollection).mockImplementation(async (name: string) => {
                if (name === 'results') {
                    return { findOne: vi.fn().mockResolvedValue(otherUserResult) } as unknown as Collection<{ _id?: ObjectId }>;
                }
                return {} as unknown as Collection<{ _id?: ObjectId }>;
            });

            const request = new Request("http://localhost:3000/results/" + mockResultId);
            const params = { id: mockResultId.toString() };

            try {
                await loader({ request, params, context: {} } as Route.LoaderArgs);
                expect.fail("Should have thrown error");
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(403);
                }
            }
        });

        it("should throw 404 if linked quiz not found", async () => {
            vi.mocked(dbServer.getCollection).mockImplementation(async (name: string) => {
                if (name === 'results') return { findOne: vi.fn().mockResolvedValue(mockResult) } as unknown as Collection<{ _id?: ObjectId }>;
                if (name === 'quizzes') return { findOne: vi.fn().mockResolvedValue(null) } as unknown as Collection<{ _id?: ObjectId }>; 
                return {} as unknown as Collection<{ _id?: ObjectId }>;
            });

            const request = new Request("http://localhost:3000/results/" + mockResultId);
            const params = { id: mockResultId.toString() };

            try {
                await loader({ request, params, context: {} } as Route.LoaderArgs);
                expect.fail("Should have thrown error");
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(404);
                }
            }
        });
    });

    describe("Component: Results", () => {
        const serializedResult = {
            _id: mockResultId.toString(),
            quizId: mockQuizId.toString(),
            userId: mockUser._id,
            sessionId: "test-session",
            score: 10,
            answers: [],
            completedAt: new Date().toISOString()
        };

        const serializedQuiz: SerializedQuiz = {
            _id: mockQuizId.toString(),
            title: "Test Quiz",
            slug: "test-quiz",
            description: "Test Description",
            questions: [
                { id: "q1", text: "Q1", type: "scale", scaleMin: 1, scaleMax: 5 }
            ],
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            scoreRanges: []
        };

        const renderComponent = (resultData: typeof serializedResult, quizData: typeof serializedQuiz) => {
             // Mock the props expected by the component
             const props = {
                loaderData: { result: resultData, quiz: quizData },
                params: { id: mockResultId.toString() },
                matches: []
             } as unknown as Route.ComponentProps;

             return render(
                 <MemoryRouter>
                    <Results {...props} />
                 </MemoryRouter>
             );
        };

        it("should render score and result details", () => {
            renderComponent(serializedResult, serializedQuiz);

            expect(screen.getByText("Reflection Complete")).toBeInTheDocument();
            expect(screen.getByText("Test Quiz")).toBeInTheDocument();
            expect(screen.getByText("10")).toBeInTheDocument(); 
            expect(screen.getByText("Doing Well")).toBeInTheDocument(); 
        });

        it("should display 'Needs Care' for low scores", () => {
            const lowScoreResult = { ...serializedResult, score: 2 }; 
            renderComponent(lowScoreResult, serializedQuiz);

            expect(screen.getByText("2")).toBeInTheDocument();
            expect(screen.getByText("Needs Care")).toBeInTheDocument();
        });

        it("should display 'Moderate' for medium scores", () => {
            const mediumScoreResult = { ...serializedResult, score: 5 }; 
            renderComponent(mediumScoreResult, serializedQuiz);

            expect(screen.getByText("5")).toBeInTheDocument();
            expect(screen.getByText("Moderate")).toBeInTheDocument();
        });

        it("should use custom score ranges if defined in quiz", () => {
            const customQuiz: SerializedQuiz = {
                ...serializedQuiz,
                scoreRanges: [
                    { min: 0, max: 10, status: "Custom Status", description: "Custom Description", color: "green" }
                ]
            };
            renderComponent(serializedResult, customQuiz);

            expect(screen.getByText("Custom Status")).toBeInTheDocument();
            expect(screen.getByText("Custom Description")).toBeInTheDocument();
        });
        
        it('should show navigation buttons', () => {
             renderComponent(serializedResult, serializedQuiz);
             
             expect(screen.getByText("Take Another Test")).toBeInTheDocument();
             expect(screen.getByText("View Journey")).toBeInTheDocument();
        });

        it('should display sub-scores if present', () => {
            const resultWithSubscores = {
                ...serializedResult,
                subScores: { 'Stress': 5, 'Anxiety': 2 }
            };
            renderComponent(resultWithSubscores, serializedQuiz);

            expect(screen.getByText('Stress')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Anxiety')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
        });

        it('should respect "lower-is-better" scoring direction', () => {
            const lowerIsBetterQuiz: SerializedQuiz = {
                ...serializedQuiz,
                scoringDirection: 'lower-is-better',
                scoreRanges: [] // Force fallback logic
            };
            
            // High score (bad)
            const badResult = { ...serializedResult, score: 90 }; // 90%
            renderComponent(badResult, lowerIsBetterQuiz);
            expect(screen.getByText('Needs Care')).toBeInTheDocument();

            // Low score (good)
            const goodResult = { ...serializedResult, score: 10 }; // 10%
            // Note: need to clear previous render if using same container, but renderComponent creates new router/render
            // But we should check logic carefully.
            // 10% < 40% -> "Doing Well" (green) in lower-is-better logic?
            // Code:
            // if (percentage >= 70) -> Needs Care
            // else if (percentage >= 40) -> Moderate
            // else -> Doing Well
        });
    });
});
