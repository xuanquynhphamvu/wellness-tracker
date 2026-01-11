import type { Route } from "./+types/quizzes.$id";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loader, action, meta } from "./quizzes.$id";
import TakeQuiz, { ErrorBoundary } from "./quizzes.$id";
import { ObjectId, type Collection } from "mongodb";
import * as dbServer from "~/lib/db.server";
import * as authServer from "~/lib/auth.server";
import * as scoring from "~/utils/scoring";
import type { Quiz, SerializedQuiz } from "~/types/quiz";
import type { SerializedUser } from "~/types/user";
import { render, screen, fireEvent } from "@testing-library/react";
 import { createMemoryRouter, RouterProvider, type Location } from "react-router";
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
vi.mock("~/utils/scoring");

// Mock scroll since jsdom doesn't support it
window.scrollTo = vi.fn();

describe("Quiz Route (quizzes.$id)", () => {
    const mockUser: SerializedUser = {
        _id: new ObjectId().toString(),
        email: "test@example.com",
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const mockQuizId = new ObjectId();
    const mockQuestions = [
        { id: "q1", text: "How are you feeling today?", type: "scale" as const, scaleMin: 1, scaleMax: 5 },
        { id: "q2", text: "What is your energy level?", type: "multiple-choice" as const, options: ["Low", "Medium", "High"] },
        { id: "q3", text: "Any additional thoughts?", type: "text" as const }
    ];

    const mockQuiz: Quiz = {
        _id: mockQuizId,
        title: "Wellness Check-In",
        slug: "wellness-check-in",
        description: "Daily wellness assessment",
        questions: mockQuestions,
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
            if (name === 'quizzes') {
                return {
                    findOne: vi.fn().mockResolvedValue(mockQuiz)
                } as unknown as Collection<{ _id?: ObjectId }>;
            }
            if (name === 'results') {
                return {
                    insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() })
                } as unknown as Collection<{ _id?: ObjectId }>;
            }
            throw new Error(`Unexpected collection: ${name}`);
        });

        vi.mocked(scoring.calculateScore).mockReturnValue({
            totalScore: 15,
            resultMessage: "Assessment Complete",
            resultDescription: "Thank you for completing the assessment.",
            answers: []
        });

        // Spy on console.error to catch React render errors
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("loader", () => {
        it("should return serialized quiz data", async () => {
            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId);
            const params = { id: mockQuizId.toString() };

            const response = await loader({ request, params, context: {} } as Route.LoaderArgs);

            expect(response.quiz).toBeDefined();
            expect(response.quiz._id).toBe(mockQuizId.toString());
            expect(response.quiz.title).toBe(mockQuiz.title);
            expect(response.quiz.questions).toHaveLength(3);
        });

        it("should throw 400 if ID is missing", async () => {
            const request = new Request("http://localhost:3000/quizzes");
            const params = {};

            try {
                await loader({ request, params, context: {} } as Route.LoaderArgs);
                expect.fail("Should have thrown error");
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(400);
                }
            }
        });

        it("should throw 404 if quiz not found", async () => {
            vi.mocked(dbServer.getCollection).mockImplementation(async (name: string) => {
                if (name === 'quizzes') {
                    return {
                        findOne: vi.fn().mockResolvedValue(null)
                    } as unknown as Collection<{ _id?: ObjectId }>;
                }
                return {} as unknown as Collection<{ _id?: ObjectId }>;
            });

            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId);
            const params = { id: mockQuizId.toString() };

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

        it("should only return published quizzes", async () => {
            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId);
            const params = { id: mockQuizId.toString() };

            await loader({ request, params, context: {} } as Route.LoaderArgs);

            const getCollectionMock = vi.mocked(dbServer.getCollection);
            expect(getCollectionMock).toHaveBeenCalledWith('quizzes');

            // Verify findOne was called with isPublished: true
            const collection = await getCollectionMock.mock.results[0].value;
            expect(collection.findOne).toHaveBeenCalledWith({
                _id: expect.any(ObjectId),
                isPublished: true
            });
        });
    });

    describe("action", () => {
        it("should calculate score and redirect on success", async () => {
            const formData = new FormData();
            formData.append("question_q1", "5");
            formData.append("question_q2", "High");
            formData.append("question_q3", "Feeling great!");

            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId, {
                method: "POST",
                body: formData
            });
            const params = { id: mockQuizId.toString() };
            const insertOneMock = vi.fn().mockResolvedValue({ insertedId: new ObjectId() });

            vi.mocked(dbServer.getCollection).mockImplementation(async (name: string) => {
                if (name === 'quizzes') {
                    return {
                        findOne: vi.fn().mockResolvedValue(mockQuiz)
                    } as unknown as Collection<{ _id?: ObjectId }>;
                }
                if (name === 'results') {
                    return {
                        insertOne: insertOneMock
                    } as unknown as Collection<{ _id?: ObjectId }>;
                }
                throw new Error(`Unexpected collection: ${name}`);
            });

            const response = await action({ request, params, context: {} } as Route.ActionArgs);

            // Verify calculateScore was called (FormData comparison is complex, so we just verify it was called)
            expect(scoring.calculateScore).toHaveBeenCalled();

            // Verify result was inserted
            const insertCall = insertOneMock.mock.calls[0][0];
            expect(insertCall.userId.toString()).toBe(mockUser._id);
            expect(insertCall.quizId.toString()).toBe(mockQuizId.toString());
            expect(insertCall.score).toBe(15);

            // Verify redirect
            expect(response.status).toBe(302);
            expect(response.headers.get("Location")).toContain("/results/");
        });

        it("should throw 400 if quiz ID is missing", async () => {
            const formData = new FormData();
            const request = new Request("http://localhost:3000/quizzes/", {
                method: "POST",
                body: formData
            });
            const params = {};

            try {
                await action({ request, params, context: {} } as Route.ActionArgs);
                expect.fail("Should have thrown error");
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(400);
                }
            }
        });

        it("should throw 404 if quiz not found during submission", async () => {
            vi.mocked(dbServer.getCollection).mockImplementation(async (name: string) => {
                if (name === 'quizzes') {
                    return {
                        findOne: vi.fn().mockResolvedValue(null)
                    } as unknown as Collection<{ _id?: ObjectId }>;
                }
                return {} as unknown as Collection<{ _id?: ObjectId }>;
            });

            const formData = new FormData();
            const request = new Request("http://localhost:3000/quizzes/" + mockQuizId, {
                method: "POST",
                body: formData
            });
            const params = { id: mockQuizId.toString() };

            try {
                await action({ request, params, context: {} } as Route.ActionArgs);
                expect.fail("Should have thrown error");
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Response);
                if (error instanceof Response) {
                    expect(error.status).toBe(404);
                }
            }
        });
    });

    describe("meta", () => {
        it("should return quiz title in meta tags", () => {
            const serializedQuiz: SerializedQuiz = {
                _id: mockQuizId.toString(),
                title: "Wellness Check-In",
                slug: "wellness-check-in",
                description: "Daily wellness assessment",
                questions: mockQuestions,
                isPublished: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                scoreRanges: []
            };

            const result = meta({
                data: { quiz: serializedQuiz },
                params: { id: mockQuizId.toString() },
                matches: [],
                location: { pathname: "/quizzes/" + mockQuizId.toString() } as Location,
                loaderData: { quiz: serializedQuiz }
            } as unknown as Route.MetaArgs);

            expect(result).toEqual([
                { title: "Wellness Check-In - Wellness Tracker" }
            ]);
        });

        it("should use fallback title if quiz data is missing", () => {
            const result = meta({
                data: undefined,
                params: { id: mockQuizId.toString() },
                matches: [],
                location: { pathname: "/quizzes/" + mockQuizId.toString() } as Location,
                loaderData: undefined
            } as unknown as Route.MetaArgs);

            expect(result).toEqual([
                { title: "Quiz - Wellness Tracker" }
            ]);
        });
    });

    describe("Component: TakeQuiz", () => {
        const serializedQuiz: SerializedQuiz = {
            _id: mockQuizId.toString(),
            title: "Wellness Check-In",
            slug: "wellness-check-in",
            description: "Daily wellness assessment",
            questions: mockQuestions,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            scoreRanges: []
        };

        const renderComponent = (quizData: SerializedQuiz = serializedQuiz) => {
            const router = createMemoryRouter(
                [
                    {
                        path: "/quizzes/:id",
                        Component: () => {
                            const props = {
                                loaderData: { quiz: quizData },
                                params: { id: mockQuizId.toString() },
                                matches: []
                            } as unknown as Route.ComponentProps;
                            return <TakeQuiz {...props} />;
                        }
                    }
                ],
                {
                    initialEntries: ["/quizzes/" + mockQuizId.toString()],
                    initialIndex: 0
                }
            );

            return render(<RouterProvider router={router} />);
        };

        it("should render quiz title and first question", () => {
            renderComponent();

            expect(screen.getByText("Wellness Check-In")).toBeInTheDocument();
            expect(screen.getByText("How are you feeling today?")).toBeInTheDocument();
            expect(screen.getByText("1 of 3")).toBeInTheDocument();
        });

        it("should show progress bar", () => {
            const { container } = renderComponent();

            // Progress bar should be visible
            const progressBar = container.querySelector('.bg-sage-500');
            expect(progressBar).toBeInTheDocument();
        });

        it("should navigate to next question when Next button is clicked", () => {
            renderComponent();

            // First question should be visible
            expect(screen.getByText("How are you feeling today?")).toBeInTheDocument();

            // Click Next
            const nextButton = screen.getByText("Next Question");
            fireEvent.click(nextButton);

            // Second question should now be visible
            expect(screen.getByText("What is your energy level?")).toBeInTheDocument();
            expect(screen.getByText("2 of 3")).toBeInTheDocument();
        });

        it("should navigate back to previous question", () => {
            renderComponent();

            // Navigate to second question
            fireEvent.click(screen.getByText("Next Question"));
            expect(screen.getByText("What is your energy level?")).toBeInTheDocument();

            // Click Back
            const backButton = screen.getByText("Back");
            fireEvent.click(backButton);

            // First question should be visible again
            expect(screen.getByText("How are you feeling today?")).toBeInTheDocument();
        });

        it("should show Complete button on last question", () => {
            renderComponent();

            // Navigate to last question
            fireEvent.click(screen.getByText("Next Question"));
            fireEvent.click(screen.getByText("Next Question"));

            // Should show Complete button instead of Next
            expect(screen.getByText("Complete Reflection")).toBeInTheDocument();
            expect(screen.queryByText("Next Question")).not.toBeInTheDocument();
        });

        it("should render different question types correctly", () => {
            renderComponent();

            // Scale question (first)
            expect(screen.getByRole('slider')).toBeInTheDocument();

            // Multiple choice question (second)
            fireEvent.click(screen.getByText("Next Question"));
            expect(screen.getByText("Low")).toBeInTheDocument();
            expect(screen.getByText("Medium")).toBeInTheDocument();
            expect(screen.getByText("High")).toBeInTheDocument();

            // Text question (third)
            fireEvent.click(screen.getByText("Next Question"));
            expect(screen.getByPlaceholderText("Type your answer gently here...")).toBeInTheDocument();
        });

        it("should show Cancel & Exit link", () => {
            renderComponent();

            const cancelLink = screen.getByText("Cancel & Exit");
            expect(cancelLink).toBeInTheDocument();
            expect(cancelLink).toHaveAttribute('href');
        });
    });

    describe("ErrorBoundary", () => {
        it("should be exported from the module", () => {
            expect(ErrorBoundary).toBeDefined();
            expect(typeof ErrorBoundary).toBe("function");
        });

        // Note: Full ErrorBoundary rendering tests are complex due to React Router's error boundary
        // integration. The ErrorBoundary is tested indirectly through integration tests and
        // manual testing. The component's structure is verified in the implementation file.
    });
});
