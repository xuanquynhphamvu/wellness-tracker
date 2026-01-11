# Track Plan: Enhanced Score Interpretation

## Phase 1: Data Model & Admin UI
- [ ] Task: Update Schema
    - [ ] Subtask: Add `scoringDirection` to `Quiz` in `app/types/quiz.ts`.
    - [ ] Subtask: Add `category` to `Question` in `app/types/quiz.ts`.
    - [ ] Subtask: Update `QuizResult` in `app/types/result.ts` to support `subScores`.
- [ ] Task: Update Admin Forms
    - [ ] Subtask: Add "Scoring Direction" control to Quiz Create/Edit forms.
    - [ ] Subtask: Add "Category" input to `QuestionEditor`.
    - [ ] Subtask: Ensure new fields are saved.
- [ ] Task: Conductor - User Manual Verification 'Data Model & Admin UI' (Protocol in workflow.md)

## Phase 2: Scoring Logic & Results
- [ ] Task: Update Scoring Utility
    - [ ] Subtask: Update `calculateScore` in `app/utils/scoring.ts` to aggregate scores by category.
    - [ ] Subtask: Update `calculateMaxScore` to support categories (optional but good).
    - [ ] Subtask: Update tests for scoring logic.
- [ ] Task: Update Results Display
    - [ ] Subtask: Update `app/routes/results.$id.tsx` to display sub-scores if present.
    - [ ] Subtask: Update `app/routes/results.$id.tsx` to respect `scoringDirection` for color coding.
- [ ] Task: Conductor - User Manual Verification 'Scoring Logic & Results' (Protocol in workflow.md)