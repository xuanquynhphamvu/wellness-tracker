# Track Plan: Enhanced Score Interpretation

## Phase 1: Data Model & Admin UI
- [ ] Task: Update Quiz Schema
    - [ ] Subtask: Add `scoringDirection` ('higher-is-better' | 'lower-is-better') to `Quiz` type in `app/types/quiz.ts`.
    - [ ] Subtask: Update `serializeQuiz` to include this field.
    - [ ] Subtask: Update validation logic if needed.
- [ ] Task: Update Admin Forms
    - [ ] Subtask: Add "Scoring Direction" control to `app/routes/admin.quizzes.new.tsx`.
    - [ ] Subtask: Add "Scoring Direction" control to `app/routes/admin.quizzes.$id.edit.tsx`.
    - [ ] Subtask: Ensure the field is saved to the database.
- [ ] Task: Conductor - User Manual Verification 'Data Model & Admin UI' (Protocol in workflow.md)

## Phase 2: Interpretation Logic
- [ ] Task: Update Results Logic
    - [ ] Subtask: Modify `app/routes/results.$id.tsx` to read `scoringDirection`.
    - [ ] Subtask: Implement the inverted logic for "Lower is Better".
    - [ ] Subtask: Add a test case for "Lower is Better" result interpretation.
- [ ] Task: Conductor - User Manual Verification 'Interpretation Logic' (Protocol in workflow.md)
