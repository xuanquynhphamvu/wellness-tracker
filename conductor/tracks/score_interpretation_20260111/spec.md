# Track Specification: Enhanced Score Interpretation

## 1. Goal
Allow administrators to define the "direction" of scoring for each quiz (e.g., "Higher is Better" vs "Lower is Better"). This setting will adjust the default result interpretation logic (labels and colors) when explicit score ranges are not defined.

## 2. Core Features
- **Scoring Direction Field:** Add `scoringDirection` to the `Quiz` schema.
- **Admin Interface:** Add a radio button or dropdown in the "Create/Edit Quiz" form to select the direction.
- **Dynamic Fallback Logic:** Update the results page to interpret scores based on this direction.
    - *Higher is Better (Default):* High score = Green, Low score = Orange.
    - *Lower is Better:* Low score = Green, High score = Orange.

## 3. User Flows
1.  **Admin Flow:**
    -   Admin creates a "Depression Test" (where high score = bad).
    -   Admin selects "Lower Score is Better" in the settings.
    -   Admin saves the quiz.
2.  **User Flow:**
    -   User takes the "Depression Test".
    -   User gets a high score (e.g., 20/27).
    -   Result page shows "Needs Care" (Orange) instead of "Doing Well" (Green).

## 4. Technical Considerations
- **Schema Update:** Modify `app/types/quiz.ts`.
- **Database:** Existing documents will default to 'higher-is-better'.
- **UI:** Update `admin.quizzes.new.tsx` and `admin.quizzes.$id.edit.tsx`.
- **Logic:** Update `app/routes/results.$id.tsx`.

## 5. Non-Functional Requirements
- **Backward Compatibility:** Ensure existing quizzes default sensibly.
