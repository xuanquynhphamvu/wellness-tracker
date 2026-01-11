# Track Specification: Enhance Progress Visualization

## 1. Goal
Transform the current text-based progress tracking into a visually engaging and data-rich experience. This involves implementing interactive line charts to visualize score trends over time and adding a detailed history view for users to drill down into past quiz attempts.

## 2. Core Features
- **Interactive Line Charts:**
    - Visual representation of score history for each quiz type.
    - Tooltips to show exact score and date on hover.
    - Responsive design to work well on mobile and desktop.
- **Detailed History View:**
    - A new page (or modal) to list all past attempts for a specific quiz.
    - Table view with Date, Score, and Status/Interpretation.
    - Link to view the full result details for any past attempt.
- **Visual Polish:**
    - Consistent color coding (matching the score range colors).
    - Empty states for charts when not enough data is available.

## 3. User Flows
1.  **View Progress Dashboard:**
    - User navigates to `/progress`.
    - User sees summary cards for each quiz.
    - **New:** Each card now features a mini trend chart (sparkline or full chart).
2.  **Drill Down:**
    - User clicks on a progress card or a "View History" button.
    - User is taken to a detailed view (`/progress/$quizId` or similar).
    - User sees a large interactive chart and a history table.

## 4. Technical Considerations
- **Charting Library:** Use `recharts` for React-based visualization. It's composable, responsive, and widely used.
- **Data Structure:** The current `QuizProgress` interface in `progress.tsx` already aggregates scores and dates, which is perfect for charting.
- **Route Structure:**
    - `app/routes/progress.tsx` (Index): Dashboard with summaries.
    - `app/routes/progress.$quizId.tsx` (New): Detailed view for a specific quiz.

## 5. Non-Functional Requirements
- **Performance:** Charts should load quickly and not block the main thread.
- **Accessibility:** Charts should have accessible labels or alternative text descriptions of the trend.
