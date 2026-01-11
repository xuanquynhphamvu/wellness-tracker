# Track Plan: Enhance Progress Visualization

## Phase 1: Infrastructure & Charting Foundation
- [ ] Task: Install Dependencies
    - [ ] Subtask: Install `recharts` and `@types/recharts` (if needed).
    - [ ] Subtask: Verify installation by checking `package.json`.
- [ ] Task: Create Base Chart Component
    - [ ] Subtask: Create `app/components/ProgressChart.tsx`.
    - [ ] Subtask: Implement a responsive line chart using `recharts` that accepts `data` (date, score) and `color` props.
    - [ ] Subtask: Write a unit test to verify the component renders without crashing.
- [ ] Task: Conductor - User Manual Verification 'Infrastructure & Charting Foundation' (Protocol in workflow.md)

## Phase 2: Dashboard Integration
- [ ] Task: Update Progress Dashboard
    - [ ] Subtask: Modify `app/routes/progress.tsx` to include the `ProgressChart` within the `ProgressCard`.
    - [ ] Subtask: Adjust layout to accommodate the chart (e.g., move stats to side or below).
    - [ ] Subtask: Ensure chart handles empty or single-data-point states gracefully.
- [ ] Task: Conductor - User Manual Verification 'Dashboard Integration' (Protocol in workflow.md)

## Phase 3: Detailed History View
- [ ] Task: Create Progress Detail Route
    - [ ] Subtask: Create `app/routes/progress.$quizId.tsx`.
    - [ ] Subtask: Implement loader to fetch full history for a specific quiz (similar to main progress loader but focused).
    - [ ] Subtask: Implement UI with a large chart and a sortable/filterable history table.
- [ ] Task: Link Dashboard to Details
    - [ ] Subtask: Update `ProgressCard` in `progress.tsx` to link to the new detail route.
    - [ ] Subtask: Add navigation back to dashboard from detail view.
- [ ] Task: Conductor - User Manual Verification 'Detailed History View' (Protocol in workflow.md)
