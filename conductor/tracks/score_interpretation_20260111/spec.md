# Track Specification: Enhanced Score Interpretation

## 1. Goal
Enhance the quiz engine to support more complex scoring scenarios, specifically:
1.  **Scoring Direction:** Allow admins to define if "High Score" is good or bad.
2.  **Multi-Scale Scoring:** Support quizzes like DASS-21 where specific subsets of questions contribute to different sub-scales (e.g., Stress, Anxiety, Depression).

## 2. Core Features
- **Scoring Direction:**
    -   Add `scoringDirection` ('higher-is-better' | 'lower-is-better') to `Quiz` schema.
    -   Update Admin UI to select this.
    -   Update Result UI to color-code total score based on this.
- **Multi-Scale Scoring:**
    -   Add `category` field to `Question` schema (e.g., "stress", "anxiety").
    -   Update `calculateScore` utility to compute scores per category.
    -   Update Result UI to display a breakdown of scores by category if categories exist.

## 3. User Flows
1.  **Admin Flow (Multi-Scale):**
    -   Admin creates "DASS-21".
    -   Adds Question 1, assigns category "Stress".
    -   Adds Question 2, assigns category "Anxiety".
    -   Saves quiz.
2.  **User Flow (Multi-Scale):**
    -   User takes DASS-21.
    -   Result page shows "Total Score" (if relevant) AND "Stress Score", "Anxiety Score".

## 4. Technical Considerations
- **Schema:**
    -   `Quiz.scoringDirection`
    -   `Question.category`
- **Scoring Logic:**
    -   `calculateScore` needs to return `subScores: Record<string, number>`.
    -   `QuizResult` needs to store `subScores` (optional).

## 5. Non-Functional Requirements
- **Backward Compatibility:** Existing quizzes without categories should work as they do now (single total score).