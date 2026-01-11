# Track Specification: Implement Full Quiz Builder

## 1. Goal
Create a comprehensive administrative interface that allows authorized users to create, edit, and manage dynamic quizzes. This system will support sophisticated question management (ordering, types) and custom score interpretations, transforming the application from a static quiz runner into a dynamic wellness platform.

## 2. Core Features
- **Quiz Management Dashboard:** A central view to list, search, and manage all quizzes.
- **Dynamic Question Editor:**
    - Add, edit, and remove questions.
    - Support for multiple question types (e.g., Scale, Multiple Choice).
    - Reorder questions (drag-and-drop or simple up/down controls).
- **Score Range Mapping:**
    - Interface to define score ranges (min, max).
    - Assign textual interpretations/feedback for each range.
- **Preview Capability:** Ability to preview the quiz structure before publishing.

## 3. User Flows
1.  **Create New Quiz:**
    - Admin navigates to "Create Quiz".
    - Enters basic info (Title, Description, Slug).
    - Adds questions one by one.
    - Defines score ranges.
    - Saves the quiz.
2.  **Edit Existing Quiz:**
    - Admin selects a quiz from the dashboard.
    - Modifies questions or score ranges.
    - Saves changes.

## 4. Technical Considerations
- **Data Model:** Update MongoDB schema to support flexible question structures and embedded score ranges.
- **State Management:** Use React Router actions for robust form handling and optimistic UI updates during complex edits.
- **Validation:** Implement server-side validation using Zod (or similar) to ensure quiz integrity (e.g., overlapping score ranges, empty questions).
- **UI/UX:** Use optimistic UI patterns for a responsive editing experience.

## 5. Non-Functional Requirements
- **Performance:** Editor should handle quizzes with 50+ questions without lag.
- **Accessibility:** Ensure all form controls and interactive elements (like reordering) are keyboard accessible.
