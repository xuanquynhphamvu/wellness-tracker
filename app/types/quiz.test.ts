import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import { serializeQuiz, type Quiz } from "./quiz";

describe("Quiz Types", () => {
    describe("serializeQuiz", () => {
        it("should correctly serialize a Quiz object", () => {
            const date = new Date("2024-01-01T00:00:00.000Z");
            const quizId = new ObjectId();

            const quiz: Quiz = {
                _id: quizId,
                title: "Test Quiz",
                description: "A test quiz",
                slug: "test-quiz",
                questions: [],
                isPublished: true,
                createdAt: date,
                updatedAt: date,
                scoreRanges: [],
                order: 1
            };

            const serialized = serializeQuiz(quiz);

            expect(serialized).toEqual({
                _id: quizId.toString(),
                title: "Test Quiz",
                description: "A test quiz",
                slug: "test-quiz",
                questions: [],
                isPublished: true,
                createdAt: date.toISOString(),
                updatedAt: date.toISOString(),
                scoreRanges: [],
                coverImage: undefined,
                order: 1,
                scoringDirection: 'higher-is-better'
            });
        });

        it("should handle missing optional fields", () => {
            const date = new Date("2024-01-01T00:00:00.000Z");

            const quiz: Quiz = {
                title: "Minimal Quiz",
                description: "Description",
                slug: "minimal-quiz",
                questions: [],
                isPublished: false,
                createdAt: date,
                updatedAt: date,
            };

            const serialized = serializeQuiz(quiz);

            expect(serialized._id).toBe("");
            expect(serialized.slug).toBe("minimal-quiz");
            expect(serialized.scoreRanges).toEqual([]);
            expect(serialized.coverImage).toBeUndefined();
        });
    });
});
