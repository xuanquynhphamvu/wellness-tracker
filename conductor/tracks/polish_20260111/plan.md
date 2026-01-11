# Track Plan: Production Polish

## Phase 1: Error Handling & Boundaries
- [ ] Task: Add Error Boundaries to User Routes
    - [ ] Subtask: Add `ErrorBoundary` to `app/routes/quizzes.$id.tsx` (handle 404/500).
    - [ ] Subtask: Add `ErrorBoundary` to `app/routes/results.$id.tsx`.
    - [ ] Subtask: Add `ErrorBoundary` to `app/routes/progress.tsx`.
- [ ] Task: Add Error Boundaries to Admin Routes
    - [ ] Subtask: Add `ErrorBoundary` to `app/routes/admin.quizzes.tsx`.
    - [ ] Subtask: Add `ErrorBoundary` to `app/routes/admin.quizzes.new.tsx` and edit route.
- [ ] Task: Conductor - User Manual Verification 'Error Handling & Boundaries' (Protocol in workflow.md)

## Phase 2: UX & Loading States
- [ ] Task: Enhance Auth Forms
    - [ ] Subtask: Verify "Logging in..." state in `auth.login.tsx`.
    - [ ] Subtask: Verify "Creating Account..." state in `auth.register.tsx`.
- [ ] Task: Enhance Quiz Forms
    - [ ] Subtask: Add pending state to `quizzes.$id.tsx` (submission button).
    - [ ] Subtask: Add pending state to `admin.quizzes.new.tsx` and edit route (save button).
- [ ] Task: Conductor - User Manual Verification 'UX & Loading States' (Protocol in workflow.md)

## Phase 3: SEO & Final Review
- [ ] Task: Audit Meta Tags
    - [ ] Subtask: Review and update `meta` functions in all user-facing routes (`home`, `quizzes`, `results`, `progress`).
    - [ ] Subtask: Ensure consistent title formatting.
- [ ] Task: Final Codebase Scan
    - [ ] Subtask: Run `npm run typecheck` and fix any lingering issues.
    - [ ] Subtask: Run `npm run lint` (if configured) or basic lint check.
- [ ] Task: Conductor - User Manual Verification 'SEO & Final Review' (Protocol in workflow.md)
