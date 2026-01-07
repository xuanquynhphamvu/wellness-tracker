# Wellness Tracker Implementation Plan

## Phase 0 Review: Foundation ✅ COMPLETE

**What exists:**
- ✅ React Router Framework v7.10.1 scaffolded
- ✅ MongoDB Atlas connection (`db.server.ts`)
- ✅ TypeScript types (`quiz.ts`, `result.ts`)
- ✅ Route files created (9 routes)
- ✅ Route configuration (`routes.ts`)
- ✅ Tailwind CSS configured
- ✅ Git repository initialized (`main` branch)

**Current state:**
- All routes have **full implementations** (loaders, actions, components)
- Database connection working
- No authentication yet
- No user sessions yet

> **IMPORTANT DISCOVERY**: Your Phase 0 is actually MORE complete than expected. You already have working loaders and actions in all routes. This means we're not starting from scratch—we're **refining and learning** from what exists.

---

## Learning Approach: Understanding Before Building

Since you already have working code, our approach will be:

1. **Audit existing code** - Understand what's already implemented
2. **Identify gaps** - What's missing vs. what's working
3. **Refactor for best practices** - Improve architecture where needed
4. **Add missing features** - Fill in authentication, sessions, etc.
5. **Master the patterns** - Learn WHY things work this way

---

## Phase 1: Route Architecture Audit & Refinement

**Goal:** Understand the existing route structure and ensure it follows React Router best practices.

### What We'll Do

#### 1.1 Audit Existing Routes
Review each route file to understand:
- What loaders are fetching
- What actions are handling
- How data flows through the app
- Where server/client boundaries are

**Routes to audit:**
- [home.tsx](file:///Users/meowiu/wellness-tracker/app/routes/home.tsx) - Homepage
- [quizzes.tsx](file:///Users/meowiu/wellness-tracker/app/routes/quizzes.tsx) - Quiz listing
- [quizzes.$id.tsx](file:///Users/meowiu/wellness-tracker/app/routes/quizzes.$id.tsx) - Take quiz
- [results.$id.tsx](file:///Users/meowiu/wellness-tracker/app/routes/results.$id.tsx) - View results
- [progress.tsx](file:///Users/meowiu/wellness-tracker/app/routes/progress.tsx) - Progress tracking
- [admin.tsx](file:///Users/meowiu/wellness-tracker/app/routes/admin.tsx) - Admin layout
- [admin.quizzes.tsx](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.tsx) - Admin quiz list
- [admin.quizzes.new.tsx](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.new.tsx) - Create quiz
- [admin.quizzes.$id.edit.tsx](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.$id.edit.tsx) - Edit quiz

#### 1.2 Document Route Hierarchy
Create a visual map of:
- Public routes (no auth required)
- App routes (user auth required)
- Admin routes (admin auth required)
- Layout nesting structure

#### 1.3 Identify Missing Routes
Determine if we need:
- Login/register routes
- User profile routes
- Error boundary routes
- 404 not found route

### Deliverables
- ✅ Route hierarchy diagram
- ✅ List of routes to add (if any)
- ✅ Understanding of current data flow

### Verification
- Can explain what each route does
- Can draw the route tree from memory
- Understand which routes need auth protection

### Git Workflow
```bash
# Stay on main for now (audit only, no code changes)
git status  # Verify clean working tree
```

---

## Phase 2: Loader Deep Dive (Read Data)

**Goal:** Master how loaders work by analyzing existing implementations.

### What We'll Learn

#### 2.1 Simple Loaders (List Data)
**Study:** `quizzes.tsx` loader
- How it fetches all quizzes from MongoDB
- How it serializes data for client
- How the component consumes `loaderData`

**Key concepts:**
- Server-side execution
- Type safety with `Route.LoaderArgs`
- Data serialization (ObjectId → string)
- No loading states needed

#### 2.2 Dynamic Loaders (Single Item)
**Study:** `quizzes.$id.tsx` loader
- How it uses `params.id` to fetch one quiz
- Error handling (quiz not found)
- Type-safe params

**Key concepts:**
- Dynamic route parameters
- 404 error handling
- Throwing responses

#### 2.3 Aggregated Loaders (Complex Queries)
**Study:** `progress.tsx` loader
- How it fetches user's quiz results
- How it groups/aggregates data
- How it shapes data for visualization

**Key concepts:**
- MongoDB aggregation pipelines
- Data shaping in loaders (not components!)
- Multiple collection queries

### Deliverables
- ✅ Written explanation of each loader pattern
- ✅ Diagram of loader execution flow
- ✅ List of loader best practices

### Verification
- Can explain when code runs (server vs client)
- Can predict what `loaderData` will contain
- Understand why we don't need `useEffect` for data fetching

### Git Workflow
```bash
# Still on main (learning only)
```

---

## Phase 3: Action Deep Dive (Write Data)

**Goal:** Master how actions work by analyzing existing implementations.

### What We'll Learn

#### 3.1 Create Actions
**Study:** `admin.quizzes.new.tsx` action
- How it receives form data
- How it validates input
- How it inserts into MongoDB
- How it redirects after success

**Key concepts:**
- FormData API
- Server-side validation
- Redirect after mutation
- Automatic revalidation

#### 3.2 Update Actions
**Study:** `admin.quizzes.$id.edit.tsx` action
- How it updates existing documents
- MongoDB update operators (`$set`)
- Handling update failures

**Key concepts:**
- Pre-filling forms with loader data
- Optimistic updates (future enhancement)
- Error handling

#### 3.3 Submit Quiz Action
**Study:** `quizzes.$id.tsx` action
- How it processes quiz answers
- How it calculates scores
- How it saves results per user

**Key concepts:**
- Complex form data (arrays, nested objects)
- Business logic in actions
- Linking data (quiz → result → user)

### Deliverables
- ✅ Written explanation of each action pattern
- ✅ Diagram of form → action → redirect flow
- ✅ List of action best practices

### Verification
- Can explain the full form submission lifecycle
- Understand why mutations happen in actions (not components)
- Can predict when loaders will rerun

### Git Workflow
```bash
# Still on main (learning only)
```

---

## Phase 4: Authentication Foundation

**Goal:** Add user authentication and session management.

> **This is where we START making changes.**

### What We'll Build

#### 4.1 User Model
Create `app/types/user.ts`:
```typescript
interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
}
```

#### 4.2 Session Management
Create `app/lib/session.server.ts`:
- Cookie-based sessions
- Login/logout helpers
- Get current user from session

**Key decisions:**
- Use React Router's built-in session storage
- Store only user ID in session (not full user object)
- Fetch user in loaders when needed

#### 4.3 Auth Routes
Create new routes:
- `auth.login.tsx` - Login form + action
- `auth.register.tsx` - Register form + action
- `auth.logout.tsx` - Logout action

#### 4.4 Password Hashing
Add `bcrypt` for secure password storage:
```bash
npm install bcrypt
npm install -D @types/bcrypt
```

### Deliverables
- ✅ User type definition
- ✅ Session management utilities
- ✅ Login/register/logout routes
- ✅ Password hashing implemented

### Verification
- Can register a new user
- Can log in with email/password
- Session persists across page refreshes
- Can log out

### Git Workflow
```bash
# Create feature branch
git checkout -b phase-4-authentication

# Make commits as you build
git add app/types/user.ts
git commit -m "Add User type definition"

git add app/lib/session.server.ts
git commit -m "Add session management utilities"

git add app/routes/auth.*.tsx
git commit -m "Add login/register/logout routes"

# When phase complete
git checkout main
git merge phase-4-authentication
git push origin main
```

---

## Phase 5: Route Protection & Authorization

**Goal:** Protect routes based on authentication and user role.

### What We'll Build

#### 5.1 Auth Helpers
Create `app/lib/auth.server.ts`:
```typescript
// Require authenticated user
async function requireUser(request: Request): Promise<User>

// Require admin user
async function requireAdmin(request: Request): Promise<User>

// Get optional user (for public routes)
async function getOptionalUser(request: Request): Promise<User | null>
```

#### 5.2 Protect User Routes
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

#### 5.3 Protect Admin Routes
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

#### 5.4 Update Actions
Add auth to all actions that modify data:
- Quiz submission action
- Admin create/update/delete actions

### Deliverables
- ✅ Auth helper functions
- ✅ All user routes protected
- ✅ All admin routes protected
- ✅ Proper redirects to login when unauthorized

### Verification
- Cannot access `/quizzes/:id` without login
- Cannot access `/admin/*` without admin role
- Redirects to `/auth/login` when unauthorized
- Can access public routes (`/`, `/quizzes` list) without login

### Git Workflow
```bash
git checkout -b phase-5-route-protection

# Commit incrementally
git add app/lib/auth.server.ts
git commit -m "Add auth helper functions"

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

## Phase 6: User-Specific Data & Progress Tracking

**Goal:** Link quiz results to users and show personalized progress.

### What We'll Build

#### 6.1 Update Result Type
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

#### 6.2 Update Quiz Submission Action
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

#### 6.3 Update Progress Loader
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

#### 6.4 Update Results Loader
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

### Deliverables
- ✅ Results linked to users
- ✅ Progress page shows only user's results
- ✅ Cannot view other users' results
- ✅ Progress tracking over time

### Verification
- User A cannot see User B's results
- Progress page shows personalized data
- Taking same quiz multiple times shows trend
- Admin can still see all results (future enhancement)

### Git Workflow
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

## Phase 7: Polish & Production Readiness

**Goal:** Add error boundaries, loading states, and improve UX.

### What We'll Build

#### 7.1 Error Boundaries
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

#### 7.2 Pending States
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

#### 7.3 Optimistic UI (Advanced)
Update UI immediately, revert on error:
```typescript
const fetcher = useFetcher();

// Show optimistic state
const optimisticData = fetcher.formData 
  ? getOptimisticData(fetcher.formData)
  : loaderData;
```

#### 7.4 Validation Improvements
- Client-side validation (HTML5)
- Server-side validation (actions)
- Display field-level errors

### Deliverables
- ✅ Error boundaries on all routes
- ✅ Loading states on forms
- ✅ Better validation messages
- ✅ Improved UX

### Verification
- Errors display nicely (not crash)
- Forms show "Saving..." state
- Validation errors are clear
- App feels polished

### Git Workflow
```bash
git checkout -b phase-7-polish

# Commit as you add features
git add app/routes/*.tsx
git commit -m "Add error boundaries to all routes"

git add app/routes/*.tsx
git commit -m "Add pending states to forms"

git checkout main
git merge phase-7-polish
git push origin main
```

---

## Why This Order Matters

### Phase 1-3: Understanding
- **Learn before building** - Understand what exists
- **No code changes** - Just reading and documenting
- **Build mental model** - How React Router works

### Phase 4: Authentication
- **Foundation for everything** - Can't protect routes without auth
- **Enables user-specific data** - Need user ID to link results

### Phase 5: Authorization
- **Depends on Phase 4** - Need auth before protecting routes
- **Security first** - Protect routes before adding more features

### Phase 6: User Data
- **Depends on Phase 4 & 5** - Need auth + protection
- **Core feature** - Personalized progress tracking

### Phase 7: Polish
- **Last** - Don't polish before features are complete
- **Production readiness** - Make it feel professional

---

## Key Architectural Principles

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

I'll now guide you through **Phase 1** step by step. We'll:

1. Review each existing route file together
2. Document what each loader/action does
3. Create a route hierarchy diagram
4. Identify any gaps

**Ready to start Phase 1?** Let me know and I'll walk you through the first route file.
