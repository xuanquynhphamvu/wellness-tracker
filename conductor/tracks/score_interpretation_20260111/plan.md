# Track Plan: Enhanced Score Interpretation

## Phase 1: Data Model & Admin UI [checkpoint: 8dc93bf]
- [x] Task: Update Schema 8dc93bf
    - [x] Subtask: Add `scoringDirection` to `Quiz` in `app/types/quiz.ts`.
    - [x] Subtask: Add `category` to `Question` in `app/types/quiz.ts`.
    - [x] Subtask: Update `QuizResult` in `app/types/result.ts` to support `subScores`.
- [x] Task: Update Admin Forms 8dc93bf
    - [x] Subtask: Add "Scoring Direction" control to Quiz Create/Edit forms.
    - [x] Subtask: Add "Category" input to `QuestionEditor`.
    - [x] Subtask: Ensure new fields are saved.
- [x] Task: Conductor - User Manual Verification 'Data Model & Admin UI' (Protocol in workflow.md) 8dc93bf

## Phase 2: Scoring Logic & Results
- [ ] Task: Update Scoring Utility
    - [ ] Subtask: Update `calculateScore` in `app/utils/scoring.ts` to aggregate scores by category.
    - [ ] Subtask: Update `calculateMaxScore` to support categories (optional but good).
    - [ ] Subtask: Update tests for scoring logic.
- [ ] Task: Update Results Display
    - [ ] Subtask: Update `app/routes/results.$id.tsx` to display sub-scores if present.
    - [ ] Subtask: Update `app/routes/results.$id.tsx` to respect `scoringDirection` for color coding.
- [ ] Task: Conductor - User Manual Verification 'Scoring Logic & Results' (Protocol in workflow.md)