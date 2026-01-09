import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import { serializeQuizResult, type QuizResult } from "./result";

describe("Result Types", () => {
    describe("serializeQuizResult", () => {
        it("should correctly serialize a QuizResult object", () => {
            const date = new Date("2024-01-01T00:00:00.000Z");
            const resultId = new ObjectId();
            const quizId = new ObjectId();
            const userId = new ObjectId();

            const result: QuizResult = {
                _id: resultId,
                quizId: quizId,
                userId: userId,
                sessionId: "session-123",
                answers: [{ questionId: "q1", answer: "a1" }],
                score: 10,
                completedAt: date
            };

            const serialized = serializeQuizResult(result);

            expect(serialized).toEqual({
                _id: resultId.toString(),
                quizId: quizId.toString(),
                userId: userId.toString(),
                sessionId: "session-123",
                answers: [{ questionId: "q1", answer: "a1" }],
                score: 10,
                completedAt: date.toISOString()
            });
        });

        it("should handle missing optional fields", () => {
            const date = new Date("2024-01-01T00:00:00.000Z");
            const quizId = new ObjectId();
            const userId = new ObjectId();

            const result: QuizResult = {
                quizId: quizId,
                userId: userId,
                answers: [],
                score: 0,
                completedAt: date
            };

            const serialized = serializeQuizResult(result);

            expect(serialized._id).toBe("");
            expect(serialized.sessionId).toBeUndefined();
        });
    });
});
