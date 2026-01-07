# Wellness Tracker - Master Implementation Plan

**Project:** Wellness Tracker - Mental Health Quiz Application  
**Framework:** React Router v7+ with TypeScript  
**Database:** MongoDB Atlas  
**Created:** January 7, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architectural Principles](#architectural-principles)
4. [Phase Overview](#phase-overview)
5. [Detailed Phase Breakdown](#detailed-phase-breakdown)
6. [Git Workflow](#git-workflow)
7. [Why This Order Matters](#why-this-order-matters)

---

## Project Overview

### What We're Building

**Wellness Tracker** is a production-grade web application for mental health assessment and progress tracking.

**User Features:**
- Register and log in with email/password
- Take wellness quizzes (stress, anxiety, burnout, etc.)
- View quiz results with detailed feedback
- Track progress over time with visualizations
- Compare results across multiple quiz attempts

**Admin Features:**
- Create new quizzes with custom questions
- Edit existing quizzes and questions
- Delete quizzes
- Manage quiz scoring logic

### Dual Purpose

This project serves **two goals**:

1. **Real Product** - Production-ready wellness tracking application
2. **Learning Exercise** - Deep mastery of React Router Framework architecture

We prioritize **understanding over speed**. Every phase includes verification steps and learning objectives.

---

## Tech Stack

### Core Technologies (Fixed)

| Technology | Version | Purpose |
|------------|---------|---------|
| React Router | v7.10.1+ | Framework (routing, loaders, actions, SSR) |
| TypeScript | Latest | Type safety and developer experience |
| MongoDB Atlas | Cloud | Production database (no local setup) |
| Tailwind CSS | Latest | Styling (utility-first) |
| bcrypt | Latest | Password hashing |

### What We're NOT Using

- ❌ No separate API layer (loaders/actions ARE the API)
- ❌ No ORM (direct MongoDB driver)
- ❌ No Redux/Zustand (server state in loaders)
- ❌ No React Query (React Router handles data fetching)
- ❌ No Express (React Router handles server)

---

## Architectural Principles

### 1. Server-First Thinking

**Data fetching → Loaders (server)**
```typescript
// ✅ Correct: Fetch in loader
export async function loader() {
  const quizzes = await getCollection('quizzes');
  return quizzes.find().toArray();
}

// ❌ Wrong: Fetch in component
export default function Component() {
  const [quizzes, setQuizzes] = useState([]);
  useEffect(() => {
    fetch('/api/quizzes').then(/* ... */);
  }, []);
}
```

**Mutations → Actions (server)**
```typescript
// ✅ Correct: Mutate in action
export async function action({ request }) {
  const formData = await request.formData();
  await getCollection('quizzes').insertOne(/* ... */);
  return redirect('/quizzes');
}

// ❌ Wrong: Mutate in component
async function handleSubmit() {
  await fetch('/api/quizzes', { method: 'POST', /* ... */ });
}
```

### 2. Route-Based Architecture

**Each route = one file with:**
- Loader (data fetching)
- Action (data mutations)
- Component (UI)
- Error boundary (error handling)

```typescript
// app/routes/quizzes.$id.tsx
export async function loader({ params }) { /* ... */ }
export async function action({ request }) { /* ... */ }
export default function QuizDetail() { /* ... */ }
export function ErrorBoundary() { /* ... */ }
```

### 3. Server-Only Code

**Use `.server.ts` suffix for:**
- Database connections
- Authentication logic
- Password hashing
- Session management
- Any code that should NEVER reach the client

```typescript
// app/lib/db.server.ts ✅
// app/lib/auth.server.ts ✅
// app/lib/session.server.ts ✅
```

### 4. No Unnecessary Abstractions

**Keep it simple:**
- Direct MongoDB queries (no ORM)
- Inline validation (no validation library unless needed)
- Standard forms (no form library)
- Minimal dependencies

**Add abstractions only when:**
- Pattern repeats 3+ times
- Complexity justifies it
- It improves clarity

### 5. Progressive Enhancement

**Forms work without JavaScript:**
```tsx
<Form method="post" action="/quizzes/new">
  <input name="title" required />
  <button type="submit">Create</button>
</Form>
```

- Server renders first (fast initial load)
- Client enhances (smooth navigation)
- Fallback to full page reload if JS fails

---

## Phase Overview

| Phase | Status | Focus | Duration |
|-------|--------|-------|----------|
| **Phase 0** | ✅ Complete | Foundation & Setup | - |
| **Phase 1** | ✅ Complete | Route Architecture Audit | 1-2 hours |
| **Phase 2** | ✅ Complete | Loader Deep Dive (Read Data) | 2-3 hours |
| **Phase 3** | ✅ Complete | Action Deep Dive (Write Data) | 2-3 hours |
| **Phase 4** | ✅ Complete | Authentication Foundation | 3-4 hours |
| **Phase 5** | 🔄 Current | Route Protection & Authorization | 2-3 hours |
| **Phase 6** | ⏳ Pending | User-Specific Data & Progress | 3-4 hours |
| **Phase 7** | ⏳ Pending | Polish & Production Readiness | 2-3 hours |

**Total estimated time:** 15-22 hours of focused learning and building

---

## Detailed Phase Breakdown

### Phase 0: Foundation ✅ COMPLETE

**Goal:** Set up project infrastructure and verify everything works.

#### What Was Done

- ✅ React Router Framework v7.10.1 scaffolded
- ✅ MongoDB Atlas connection configured (`db.server.ts`)
- ✅ TypeScript types created (`quiz.ts`, `result.ts`, `user.ts`)
- ✅ Route files created (12 routes total)
- ✅ Route configuration (`routes.ts`)
- ✅ Tailwind CSS configured
- ✅ Git repository initialized (`main` branch)
- ✅ Environment variables configured (`.env`)

#### Current State

- All routes have full implementations (loaders, actions, components)
- Database connection working
- Authentication implemented
- No route protection yet
- No user-specific data yet

#### Git Workflow

```bash
# Already on main branch
git status  # Verify clean working tree
```

---

### Phase 1: Route Architecture Audit ✅ COMPLETE

**Goal:** Understand the existing route structure and ensure it follows React Router best practices.

#### What We Did

**1.1 Audited Existing Routes**

Reviewed each route file to understand:
- What loaders are fetching
- What actions are handling
- How data flows through the app
- Where server/client boundaries are

**Routes audited:**
- `home.tsx` - Homepage
- `quizzes.tsx` - Quiz listing
- `quizzes.$id.tsx` - Take quiz
- `results.$id.tsx` - View results
- `progress.tsx` - Progress tracking
- `admin.tsx` - Admin layout
- `admin.quizzes.tsx` - Admin quiz list
- `admin.quizzes.new.tsx` - Create quiz
- `admin.quizzes.$id.edit.tsx` - Edit quiz
- `auth.login.tsx` - Login
- `auth.register.tsx` - Register
- `auth.logout.tsx` - Logout

**1.2 Documented Route Hierarchy**

Created visual map of:
- Public routes (no auth required)
- App routes (user auth required)
- Admin routes (admin auth required)
- Layout nesting structure

**1.3 Identified Missing Routes**

Determined we need:
- ✅ Login/register routes (added)
- ✅ Error boundary routes (added)
- ⏳ 404 not found route (future)

#### Deliverables

- ✅ Route hierarchy diagram
- ✅ List of routes to add
- ✅ Understanding of current data flow
- ✅ Documentation: `docs/learning-phases/phase1_route_analysis.md`

#### Verification

- ✅ Can explain what each route does
- ✅ Can draw the route tree from memory
- ✅ Understand which routes need auth protection

#### Git Workflow

```bash
# Stayed on main (audit only, no code changes)
git status  # Verified clean working tree
```

---

### Phase 2: Loader Deep Dive (Read Data) ✅ COMPLETE

**Goal:** Master how loaders work by analyzing existing implementations.

#### What We Learned

**2.1 Simple Loaders (List Data)**

**Studied:** `quizzes.tsx` loader
- How it fetches all quizzes from MongoDB
- How it serializes data for client
- How the component consumes `loaderData`

**Key concepts:**
- Server-side execution
- Type safety with `Route.LoaderArgs`
- Data serialization (ObjectId → string)
- No loading states needed

**2.2 Dynamic Loaders (Single Item)**

**Studied:** `quizzes.$id.tsx` loader
- How it uses `params.id` to fetch one quiz
- Error handling (quiz not found)
- Type-safe params

**Key concepts:**
- Dynamic route parameters
- 404 error handling
- Throwing responses

**2.3 Aggregated Loaders (Complex Queries)**

**Studied:** `progress.tsx` loader
- How it fetches user's quiz results
- How it groups/aggregates data
- How it shapes data for visualization

**Key concepts:**
- MongoDB aggregation pipelines
- Data shaping in loaders (not components!)
- Multiple collection queries

#### Deliverables

- ✅ Written explanation of each loader pattern
- ✅ Diagram of loader execution flow
- ✅ List of loader best practices
- ✅ Documentation: `docs/learning-phases/phase2_loader_deep_dive.md`

#### Verification

- ✅ Can explain when code runs (server vs client)
- ✅ Can predict what `loaderData` will contain
- ✅ Understand why we don't need `useEffect` for data fetching

#### Git Workflow

```bash
# Stayed on main (learning only)
```

---

### Phase 3: Action Deep Dive (Write Data) ✅ COMPLETE

**Goal:** Master how actions work by analyzing existing implementations.

#### What We Learned

**3.1 Create Actions**

**Studied:** `admin.quizzes.new.tsx` action
- How it receives form data
- How it validates input
- How it inserts into MongoDB
- How it redirects after success

**Key concepts:**
- FormData API
- Server-side validation
- Redirect after mutation
- Automatic revalidation

**3.2 Update Actions**

**Studied:** `admin.quizzes.$id.edit.tsx` action
- How it updates existing documents
- MongoDB update operators (`$set`)
- Handling update failures

**Key concepts:**
- Pre-filling forms with loader data
- Optimistic updates (future enhancement)
- Error handling

**3.3 Submit Quiz Action**

**Studied:** `quizzes.$id.tsx` action
- How it processes quiz answers
- How it calculates scores
- How it saves results per user

**Key concepts:**
- Complex form data (arrays, nested objects)
- Business logic in actions
- Linking data (quiz → result → user)

#### Deliverables

- ✅ Written explanation of each action pattern
- ✅ Diagram of form → action → redirect flow
- ✅ List of action best practices
- ✅ Documentation: `docs/learning-phases/phase3_action_deep_dive.md`

#### Verification

- ✅ Can explain the full form submission lifecycle
- ✅ Understand why mutations happen in actions (not components)
- ✅ Can predict when loaders will rerun

#### Git Workflow

```bash
# Stayed on main (learning only)
```

---

### Phase 4: Authentication Foundation ✅ COMPLETE

**Goal:** Add user authentication and session management.

> **This is where we STARTED making changes.**

#### What We Built

**4.1 User Model**

Created `app/types/user.ts`:
```typescript
interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface SerializedUser {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  // passwordHash excluded for security
}
```

**4.2 Session Management**

Created `app/lib/session.server.ts`:
- Cookie-based sessions (encrypted)
- Login/logout helpers
- Get current user from session

**Key decisions:**
- Use React Router's built-in session storage
- Store only user ID in session (not full user object)
- Fetch user in loaders when needed

**4.3 Auth Routes**

Created new routes:
- `auth.login.tsx` - Login form + action
- `auth.register.tsx` - Register form + action
- `auth.logout.tsx` - Logout action

**4.4 Password Hashing**

Added `bcrypt` for secure password storage:
```bash
npm install bcrypt
npm install -D @types/bcrypt
```

**4.5 Authentication Helpers**

Created `app/lib/auth.server.ts`:
- `hashPassword()` - Hash passwords with bcrypt
- `verifyPassword()` - Verify password against hash
- `createUser()` - Create new user
- `verifyLogin()` - Verify email/password
- `getUserById()` - Fetch user by ID
- `getUserByEmail()` - Fetch user by email
- `getOptionalUser()` - Get user or null (public routes)
- `requireUser()` - Require auth (redirect if not logged in)
- `requireAdmin()` - Require admin role (throw 403 if not admin)

#### Deliverables

- ✅ User type definition
- ✅ Session management utilities
- ✅ Login/register/logout routes
- ✅ Password hashing implemented
- ✅ Authentication helpers
- ✅ Documentation: `docs/learning-phases/phase4_authentication.md`

#### Verification

- ✅ Can register a new user
- ✅ Can log in with email/password
- ✅ Session persists across page refreshes
- ✅ Can log out
- ✅ Passwords are hashed (not plain text)

#### Git Workflow

```bash
# Create feature branch
git checkout -b phase-4-authentication

# Make commits as you build
git add app/types/user.ts
git commit -m "Add User type definition"

git add app/lib/session.server.ts
git commit -m "Add session management utilities"

git add app/lib/auth.server.ts
git commit -m "Add authentication helpers"

git add app/routes/auth.*.tsx
git commit -m "Add login/register/logout routes"

# When phase complete
git checkout main
git merge phase-4-authentication
git push origin main
```

---

### Phase 5: Route Protection & Authorization 🔄 CURRENT

**Goal:** Protect routes based on authentication and user role.

#### What We'll Build

**5.1 Protect User Routes**

Add auth checks to loaders:
- `quizzes.$id.tsx` - Must be logged in to take quiz
- `results.$id.tsx` - Must be logged in + own the result
- `progress.tsx` - Must be logged in

**Pattern:**
```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  // Now we know user is authenticated
  const results = await getCollection<QuizResult>('results');
  const userResults = await results.find({ userId: user._id }).toArray();
  return { results: userResults };
}
```

**5.2 Protect Admin Routes**

Add admin checks to admin loaders:
- `admin.quizzes.tsx`
- `admin.quizzes.new.tsx`
- `admin.quizzes.$id.edit.tsx`

**Pattern:**
```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  // Now we know user is admin
  // ... fetch admin data
}
```

**5.3 Update Actions**

Add auth to all actions that modify data:
- Quiz submission action
- Admin create/update/delete actions

**5.4 Update Root Loader**

Add user to root loader for global access:
```typescript
// app/root.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request);
  return { user };
}
```

#### Deliverables

- ⏳ Auth helper functions (already done in Phase 4)
- ⏳ All user routes protected
- ⏳ All admin routes protected
- ⏳ Proper redirects to login when unauthorized
- ⏳ User available in all routes via root loader

#### Verification

- ⏳ Cannot access `/quizzes/:id` without login
- ⏳ Cannot access `/admin/*` without admin role
- ⏳ Redirects to `/auth/login` when unauthorized
- ⏳ Can access public routes (`/`, `/quizzes` list) without login
- ⏳ User info available in navigation (show email, logout button)

#### Git Workflow

```bash
git checkout -b phase-5-route-protection

# Commit incrementally
git add app/root.tsx
git commit -m "Add user to root loader"

git add app/routes/quizzes.$id.tsx app/routes/results.$id.tsx app/routes/progress.tsx
git commit -m "Protect user routes with authentication"

git add app/routes/admin.*.tsx
git commit -m "Protect admin routes with role check"

# Merge when complete
git checkout main
git merge phase-5-route-protection
git push origin main
```

---

### Phase 6: User-Specific Data & Progress Tracking ⏳ PENDING

**Goal:** Link quiz results to users and show personalized progress.

#### What We'll Build

**6.1 Update Result Type**

Modify `app/types/result.ts`:
```typescript
interface QuizResult {
  _id?: ObjectId;
  userId: ObjectId;  // ← Add this
  quizId: ObjectId;
  answers: Answer[];
  score: number;
  completedAt: Date;
}
```

**6.2 Update Quiz Submission Action**

Modify `quizzes.$id.tsx` action to save user ID:
```typescript
export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireUser(request);  // Get current user
  const formData = await request.formData();
  
  const results = await getCollection<QuizResult>('results');
  await results.insertOne({
    userId: user._id,  // ← Save user ID
    quizId: new ObjectId(params.id),
    answers: extractAnswers(formData),
    score: calculateScore(answers),
    completedAt: new Date(),
  });
  
  return redirect(`/results/${result.insertedId}`);
}
```

**6.3 Update Progress Loader**

Modify `progress.tsx` loader to filter by user:
```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  
  const results = await getCollection<QuizResult>('results');
  const userResults = await results
    .find({ userId: user._id })  // ← Filter by user
    .sort({ completedAt: -1 })
    .toArray();
  
  // Group by quiz, show trends over time
  const progressData = groupResultsByQuiz(userResults);
  
  return { progressData };
}
```

**6.4 Update Results Loader**

Modify `results.$id.tsx` loader to verify ownership:
```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  
  const results = await getCollection<QuizResult>('results');
  const result = await results.findOne({ _id: new ObjectId(params.id) });
  
  if (!result) {
    throw new Response("Result not found", { status: 404 });
  }
  
  // Verify user owns this result
  if (result.userId.toString() !== user._id.toString()) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  return { result: serializeResult(result) };
}
```

**6.5 Build Progress Visualization**

Create helper to group results by quiz:
```typescript
function groupResultsByQuiz(results: QuizResult[]) {
  const grouped = new Map();
  
  for (const result of results) {
    const quizId = result.quizId.toString();
    if (!grouped.has(quizId)) {
      grouped.set(quizId, []);
    }
    grouped.get(quizId).push(result);
  }
  
  return Array.from(grouped.entries()).map(([quizId, results]) => ({
    quizId,
    attempts: results.length,
    scores: results.map(r => r.score),
    dates: results.map(r => r.completedAt),
    trend: calculateTrend(results),
  }));
}
```

#### Deliverables

- ⏳ Results linked to users
- ⏳ Progress page shows only user's results
- ⏳ Cannot view other users' results
- ⏳ Progress tracking over time
- ⏳ Trend visualization (improving/declining)

#### Verification

- ⏳ User A cannot see User B's results
- ⏳ Progress page shows personalized data
- ⏳ Taking same quiz multiple times shows trend
- ⏳ Admin can still see all results (future enhancement)

#### Git Workflow

```bash
git checkout -b phase-6-user-data

git add app/types/result.ts
git commit -m "Add userId to QuizResult type"

git add app/routes/quizzes.$id.tsx
git commit -m "Link quiz results to current user"

git add app/routes/progress.tsx
git commit -m "Filter progress by current user"

git add app/routes/results.$id.tsx
git commit -m "Verify result ownership before displaying"

git checkout main
git merge phase-6-user-data
git push origin main
```

---

### Phase 7: Polish & Production Readiness ⏳ PENDING

**Goal:** Add error boundaries, loading states, and improve UX.

#### What We'll Build

**7.1 Error Boundaries**

Add error handling to each route:
```typescript
export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }
  
  return <div>Something went wrong!</div>;
}
```

**7.2 Pending States**

Use `useNavigation()` to show loading indicators:
```typescript
export default function Component() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <Form method="post">
      <button disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </Form>
  );
}
```

**7.3 Optimistic UI (Advanced)**

Update UI immediately, revert on error:
```typescript
const fetcher = useFetcher();

// Show optimistic state
const optimisticData = fetcher.formData 
  ? getOptimisticData(fetcher.formData)
  : loaderData;
```

**7.4 Validation Improvements**

- Client-side validation (HTML5)
- Server-side validation (actions)
- Display field-level errors
- Better error messages

**7.5 404 Not Found Route**

Create catch-all route for 404s:
```typescript
// app/routes/$.tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <Link to="/">Go Home</Link>
    </div>
  );
}
```

**7.6 Meta Tags & SEO**

Add meta tags to all routes:
```typescript
export function meta({ data }: Route.MetaArgs) {
  return [
    { title: "Quiz Title - Wellness Tracker" },
    { name: "description", content: "Take wellness quizzes..." },
  ];
}
```

**7.7 Accessibility**

- Proper ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

#### Deliverables

- ⏳ Error boundaries on all routes
- ⏳ Loading states on forms
- ⏳ Better validation messages
- ⏳ 404 page
- ⏳ Meta tags for SEO
- ⏳ Accessibility improvements
- ⏳ Improved UX

#### Verification

- ⏳ Errors display nicely (not crash)
- ⏳ Forms show "Saving..." state
- ⏳ Validation errors are clear
- ⏳ 404 page works
- ⏳ App feels polished
- ⏳ Keyboard navigation works

#### Git Workflow

```bash
git checkout -b phase-7-polish

# Commit as you add features
git add app/routes/*.tsx
git commit -m "Add error boundaries to all routes"

git add app/routes/*.tsx
git commit -m "Add pending states to forms"

git add app/routes/$.tsx
git commit -m "Add 404 not found page"

git checkout main
git merge phase-7-polish
git push origin main
```

---

## Git Workflow

### Branch Strategy

**Main branch:**
- Always stable
- Only merge complete phases
- Production-ready at all times

**Feature branches:**
- One branch per phase
- Named: `phase-X-description`
- Examples:
  - `phase-4-authentication`
  - `phase-5-route-protection`
  - `phase-6-user-data`

### Commit Strategy

**Commit frequently:**
- One logical change per commit
- Descriptive commit messages
- Follow conventional commits format

**Examples:**
```bash
git commit -m "Add User type definition"
git commit -m "Add session management utilities"
git commit -m "Protect user routes with authentication"
git commit -m "Fix: Handle missing user in session"
```

### Merge Strategy

**When to merge:**
- Phase is complete
- All verification steps pass
- Code is tested and working

**How to merge:**
```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Merge feature branch
git merge phase-X-description

# Push to remote
git push origin main

# Delete feature branch (optional)
git branch -d phase-X-description
```

---

## Why This Order Matters

### Phase 0-3: Understanding

**Learn before building:**
- Understand what exists
- No code changes (just reading and documenting)
- Build mental model of React Router

**Why first:**
- Can't improve what you don't understand
- Prevents premature refactoring
- Identifies patterns before abstracting

### Phase 4: Authentication

**Foundation for everything:**
- Can't protect routes without auth
- Enables user-specific data
- Required for all future features

**Why before Phase 5:**
- Need user sessions before protecting routes
- Need user ID before linking data

### Phase 5: Authorization

**Depends on Phase 4:**
- Need auth before protecting routes
- Security first (protect before adding features)

**Why before Phase 6:**
- Must verify user is logged in
- Must verify user owns data
- Prevents unauthorized access

### Phase 6: User Data

**Depends on Phase 4 & 5:**
- Need auth + protection
- Core feature (personalized progress)

**Why before Phase 7:**
- Polish comes after features are complete
- Can't polish what doesn't exist

### Phase 7: Polish

**Last:**
- Don't polish before features are complete
- Production readiness
- Make it feel professional

---

## Key Architectural Principles (Recap)

### 1. Server-First Thinking

- **Data fetching** → Loaders (server)
- **Mutations** → Actions (server)
- **Business logic** → Server-side utilities
- **UI rendering** → Components (both server + client)

### 2. Route-Based Architecture

- **Each route = one file** - Easy to find code
- **Loaders + actions + component** - Everything in one place
- **Type-safe** - TypeScript knows what data is available

### 3. Progressive Enhancement

- **Forms work without JS** - Use native `<form>` + `method="post"`
- **Server renders first** - Fast initial page load
- **Client enhances** - Smooth navigation after hydration

### 4. No Unnecessary Abstractions

- **Direct MongoDB access** - No ORM needed
- **No API layer** - Loaders/actions ARE the API
- **Minimal dependencies** - Only what's needed

---

## Next Steps

**Current Phase:** Phase 5 - Route Protection & Authorization

**Immediate tasks:**
1. Add user to root loader
2. Protect user routes (`quizzes.$id`, `results.$id`, `progress`)
3. Protect admin routes (`admin.*`)
4. Test protection (try accessing without login)
5. Verify redirects work correctly

**After Phase 5:**
- Move to Phase 6 (User-Specific Data)
- Then Phase 7 (Polish)
- Then celebrate! 🎉

---

## Learning Resources

**Documentation created:**
- `docs/learning-phases/phase1_route_analysis.md`
- `docs/learning-phases/phase2_loader_deep_dive.md`
- `docs/learning-phases/phase3_action_deep_dive.md`
- `docs/learning-phases/phase4_authentication.md`
- `docs/implementation_plan.md` (original plan)
- `docs/MASTER_PLAN.md` (this document)

**Official docs:**
- [React Router v7 Docs](https://reactrouter.com)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Remember:** This is a learning journey. Take your time, understand deeply, and build something you're proud of! 🚀
