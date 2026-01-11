# Track Plan: Implement Full Quiz Builder

## Phase 1: Data Model & Backend Foundation [checkpoint: d7bc5ca]
- [x] Task: Update Quiz Schema d7bc5ca
    - [x] Subtask: Define TypeScript interfaces for `Question` (with types), `ScoreRange`, and updated `Quiz` model.
    - [x] Subtask: Update MongoDB validation schema (if applicable) or Zod validators to reflect the new structure.
- [x] Task: Create/Update Backend Services d7bc5ca
    - [x] Subtask: Create `app/lib/quiz.server.ts` functions for CRUD operations on Quizzes, specifically handling the nested `questions` and `scoreRanges` arrays.
    - [x] Subtask: Write unit tests for these service functions.
- [x] Task: Conductor - User Manual Verification 'Data Model & Backend Foundation' (Protocol in workflow.md) d7bc5ca

## Phase 2: Quiz Management Dashboard (List & Create) [checkpoint: 8582b92]
- [x] Task: Enhance Admin Quiz List f706761
    - [x] Subtask: Update `app/routes/admin.quizzes.tsx` to display more details (question count, status) and provide "Edit" and "Delete" actions.
    - [x] Subtask: Write integration tests for the list view loader.
- [x] Task: Basic Quiz Creation Form 2bcb5b8
    - [x] Subtask: Update `app/routes/admin.quizzes.new.tsx` to handle basic metadata (title, description, slug, cover image).
    - [x] Subtask: Implement the server-side action to create the quiz document.
    - [x] Subtask: Write end-to-end test for creating a quiz shell.
- [x] Task: Conductor - User Manual Verification 'Quiz Management Dashboard (List & Create)' (Protocol in workflow.md) 8582b92

## Phase 3: Dynamic Question Editor [checkpoint: 9ec79f3]
- [x] Task: Question Component Architecture 8680edb
    - [x] Subtask: Create `app/components/admin/QuestionEditor.tsx` component to handle a single question's state (text, type, options).
    - [x] Subtask: Create `app/components/admin/QuestionList.tsx` to manage the array of questions.
- [x] Task: Implement Question Management Logic e11193c
    - [x] Subtask: Implement "Add Question", "Remove Question", and "Update Question" logic within the client-side state (before save).
    - [x] Subtask: Implement basic reordering (move up/down buttons) for accessibility.
- [x] Task: Integrate with Edit Route bde094d
    - [x] Subtask: Update `app/routes/admin.quizzes.$id.edit.tsx` to include the `QuestionList` component.
    - [x] Subtask: Update the route `action` to process and save the full list of questions.
    - [x] Subtask: Write integration tests for saving complex quiz structures.
- [x] Task: Conductor - User Manual Verification 'Dynamic Question Editor' (Protocol in workflow.md) 9ec79f3

## Phase 4: Score Range Configuration & Final Polish [checkpoint: e1feb36]
- [x] Task: Score Range Editor ab11825
    - [x] Subtask: Create `app/components/admin/ScoreRangeEditor.tsx` to manage min/max/interpretation fields.
    - [x] Subtask: Integrate into the Edit Route.
    - [x] Subtask: Add server-side validation to ensure ranges don't overlap and cover the possible score spectrum.
- [x] Task: Final Polish & UI Review d6e4e6b
    - [x] Subtask: Apply Tailwind styling for a clean, professional admin interface.
    - [x] Subtask: Ensure keyboard navigation works for all new inputs and controls.
    - [x] Subtask: Manual verification of the full "Create -> Edit -> Take" flow.
- [x] Task: Conductor - User Manual Verification 'Score Range Configuration & Final Polish' (Protocol in workflow.md) e1feb36
