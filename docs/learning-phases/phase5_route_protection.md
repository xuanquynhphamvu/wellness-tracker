# Phase 5: Route Protection & Authorization

**Completed:** January 7, 2026  
**Duration:** ~2 hours  
**Complexity:** Medium-High

---

## Table of Contents

1. [Overview](#overview)
2. [What We Built](#what-we-built)
3. [Route Protection Patterns](#route-protection-patterns)
4. [Authorization Patterns](#authorization-patterns)
5. [Admin Quiz Editor](#admin-quiz-editor)
6. [Key Learnings](#key-learnings)
7. [Common Pitfalls](#common-pitfalls)
8. [Testing & Verification](#testing--verification)

---

## Overview

Phase 5 focused on **securing the application** by implementing authentication-based route protection and role-based authorization. We also built a comprehensive admin quiz editor with dynamic question management.

### Goals Achieved

✅ Protected user routes (require authentication)  
✅ Protected admin routes (require admin role)  
✅ Implemented ownership verification  
✅ Added user to root loader for global access  
✅ Built dynamic quiz editor for admins  
✅ Fixed server-only module errors  
✅ Seeded database with test data

---

## What We Built

### 1. Route Protection System

**Protected User Routes:**
- [`quizzes.$id.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/quizzes.$id.tsx) - Take quiz (auth required)
- [`results.$id.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/results.$id.tsx) - View results (auth + ownership)
- [`progress.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/progress.tsx) - View progress (auth required)

**Protected Admin Routes:**
- [`admin.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/admin.tsx) - Admin layout (admin role required)
- [`admin.quizzes.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.tsx) - Manage quizzes
- [`admin.quizzes.new.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.new.tsx) - Create quiz
- [`admin.quizzes.$id.edit.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.$id.edit.tsx) - Edit quiz

### 2. Admin Quiz Editor

**Features:**
- Dynamic question management (add/remove/edit)
- Support for 3 question types:
  - Multiple-choice (with score mapping)
  - Scale (min/max values)
  - Text (free-form responses)
- Real-time validation
- Reusable `QuestionEditor` component

### 3. Type System Updates

**Fixed `QuizResult` type:**
```typescript
// Before
interface QuizResult {
  userId?: string;  // Optional string
}

// After
interface QuizResult {
  userId: ObjectId;  // Required ObjectId
}
```

---

## Route Protection Patterns

### Pattern 1: Basic Authentication Check

**Use Case:** Protect routes that require any authenticated user

**Implementation:**
```typescript
// In loader
export async function loader({ request }: Route.LoaderArgs) {
  // Redirects to login if not authenticated
  const user = await requireUser(request);
  
  // Continue with route logic
  const data = await fetchData();
  return { data };
}
```

**Example:** [`progress.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/progress.tsx)

**How it works:**
1. `requireUser()` checks session for user ID
2. If no user ID → redirect to `/auth/login?redirectTo=/current-path`
3. If user ID exists → fetch user from database
4. If user not found → redirect to login
5. Return serialized user object

### Pattern 2: Ownership Verification

**Use Case:** Users can only access their own data

**Implementation:**
```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  // 1. Require authentication
  const user = await requireUser(request);
  
  // 2. Fetch the resource
  const result = await results.findOne({ _id: new ObjectId(params.id) });
  
  if (!result) {
    throw new Response("Not found", { status: 404 });
  }
  
  // 3. Verify ownership
  if (result.userId.toString() !== user._id) {
    throw new Response("Forbidden: You can only view your own results", { 
      status: 403 
    });
  }
  
  // 4. Return data
  return { result };
}
```

**Example:** [`results.$id.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/results.$id.tsx)

**Why this order matters:**
1. Check auth first (401 if not logged in)
2. Check resource exists (404 if not found)
3. Check ownership (403 if forbidden)

### Pattern 3: Role-Based Authorization

**Use Case:** Restrict routes to specific user roles

**Implementation:**
```typescript
// In layout loader (protects all child routes)
export async function loader({ request }: Route.LoaderArgs) {
  // Checks for admin role, redirects if not admin
  await requireAdmin(request);
  return {};
}
```

**Example:** [`admin.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/admin.tsx)

**Layout loader advantage:**
- Runs **before** all child route loaders
- Protects entire `/admin/*` tree with one check
- No need to add `requireAdmin()` to every admin route

### Pattern 4: Protecting Actions

**Use Case:** Secure data mutations

**Implementation:**
```typescript
export async function action({ request }: Route.ActionArgs) {
  // Always check auth/authorization in actions
  const user = await requireUser(request);
  
  const formData = await request.formData();
  // ... handle mutation
  
  return redirect('/success');
}
```

**Example:** [`quizzes.$id.tsx`](file:///Users/meowiu/wellness-tracker/app/routes/quizzes.$id.tsx)

**Why protect actions:**
- Loaders run on page load
- Actions run on form submission
- Both need protection (don't assume loader ran first)

---

## Authorization Patterns

### Helper Functions

**Location:** [`app/lib/auth.server.ts`](file:///Users/meowiu/wellness-tracker/app/lib/auth.server.ts)

#### `getOptionalUser(request)`

Returns user or null (doesn't redirect)

```typescript
export async function getOptionalUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  
  const user = await getUserById(userId);
  return user ? serializeUser(user) : null;
}
```

**Use cases:**
- Root loader (show login/logout based on auth state)
- Public pages with optional auth features

#### `requireUser(request, redirectTo?)`

Returns user or redirects to login

```typescript
export async function requireUser(request: Request, redirectTo?: string) {
  const userId = await getUserId(request);
  
  if (!userId) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams([
      ['redirectTo', redirectTo || url.pathname],
    ]);
    throw redirect(`/auth/login?${searchParams}`);
  }
  
  const user = await getUserById(userId);
  if (!user) {
    throw redirect('/auth/login');
  }
  
  return serializeUser(user);
}
```

**Use cases:**
- Protected user routes
- Any route requiring authentication

#### `requireAdmin(request)`

Returns admin user or throws 403

```typescript
export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  
  if (user.role !== 'admin') {
    throw new Response('Forbidden: Admin access required', { 
      status: 403 
    });
  }
  
  return user;
}
```

**Use cases:**
- Admin routes
- Admin-only actions

### The `redirectTo` Pattern

**Purpose:** Return users to their intended destination after login

**Flow:**
```
1. User visits /quizzes/123 (protected)
2. Not logged in → redirect to /auth/login?redirectTo=/quizzes/123
3. User logs in
4. Login action reads redirectTo from FormData
5. Redirect to /quizzes/123 (original destination)
```

**Implementation in login action:**
```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const redirectTo = String(formData.get('redirectTo') || '/');
  
  // ... verify credentials
  
  return createUserSession(user._id.toString(), redirectTo);
}
```

---

## Admin Quiz Editor

### Architecture

**Component:** [`QuestionEditor.tsx`](file:///Users/meowiu/wellness-tracker/app/components/QuestionEditor.tsx)

**State Management:**
```typescript
const [questions, setQuestions] = useState<Question[]>(initialQuestions);
```

**Form Submission:**
```typescript
<Form method="post">
  <input type="hidden" name="questions" value={JSON.stringify(questions)} />
  {/* Other form fields */}
</Form>
```

### Question Types

#### 1. Multiple Choice

**Features:**
- Dynamic options (add/remove)
- Score mapping per option
- Minimum 2 options required

**Data Structure:**
```typescript
{
  id: '1',
  text: 'How are you feeling?',
  type: 'multiple-choice',
  options: ['Great', 'Good', 'Okay', 'Bad'],
  scoreMapping: {
    'Great': 0,
    'Good': 1,
    'Okay': 2,
    'Bad': 3,
  }
}
```

#### 2. Scale

**Features:**
- Configurable min/max values
- Numeric slider input
- Score = selected value

**Data Structure:**
```typescript
{
  id: '2',
  text: 'Rate your stress level',
  type: 'scale',
  scaleMin: 1,
  scaleMax: 10,
}
```

#### 3. Text

**Features:**
- Free-form text input
- No scoring
- Good for qualitative data

**Data Structure:**
```typescript
{
  id: '3',
  text: 'Describe your symptoms',
  type: 'text',
}
```

### State Management Pattern

**Adding a question:**
```typescript
const addQuestion = () => {
  const newQuestion: Question = {
    id: `${Date.now()}`,  // Unique ID
    text: '',
    type: 'multiple-choice',
    options: ['', ''],
    scoreMapping: {},
  };
  setQuestions([...questions, newQuestion]);
};
```

**Updating a question:**
```typescript
const updateQuestion = (index: number, updatedQuestion: Question) => {
  const newQuestions = [...questions];
  newQuestions[index] = updatedQuestion;
  setQuestions(newQuestions);
};
```

**Removing a question:**
```typescript
const removeQuestion = (index: number) => {
  if (questions.length > 1) {  // Keep at least 1 question
    setQuestions(questions.filter((_, i) => i !== index));
  }
};
```

### Form Serialization

**Problem:** React state doesn't automatically sync with FormData

**Solution:** Hidden input field that updates with state

```typescript
<input 
  type="hidden" 
  name="questions" 
  value={JSON.stringify(questions)} 
/>
```

**Why this works:**
- Hidden input re-renders when `questions` state changes
- `value` attribute always has latest JSON
- FormData includes this field on submit
- Server receives JSON string in `formData.get('questions')`

### Server-Side Validation

**Validation rules:**
```typescript
// At least 1 question
if (questions.length === 0) {
  errors.questions = 'At least one question is required';
}

// Each question has text
questions.forEach((q, index) => {
  if (!q.text || q.text.trim().length === 0) {
    errors[`question_${index}`] = `Question ${index + 1} text is required`;
  }
  
  // Multiple-choice specific
  if (q.type === 'multiple-choice') {
    if (!q.options || q.options.length < 2) {
      errors[`question_${index}`] = 'Must have at least 2 options';
    }
    if (q.options?.some(opt => !opt || opt.trim().length === 0)) {
      errors[`question_${index}`] = 'Has empty options';
    }
  }
  
  // Scale specific
  if (q.type === 'scale') {
    if ((q.scaleMin || 0) >= (q.scaleMax || 0)) {
      errors[`question_${index}`] = 'Scale min must be less than max';
    }
  }
});
```

---

## Key Learnings

### 1. Layout Loaders Cascade Protection

**Discovery:** Adding `requireAdmin()` to the admin layout loader automatically protects all child routes.

**Why it works:**
- React Router runs parent loaders before child loaders
- If parent throws redirect/response, children never run
- One check protects entire route tree

**Example:**
```typescript
// app/routes/admin.tsx
export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);  // Protects ALL /admin/* routes
  return {};
}
```

### 2. Server-Only Module Detection

**Problem:** Importing server-only code at the top level causes build errors

**Error Message:**
```
Server-only module referenced by client
'~/lib/db.server' imported by route 'app/routes/quizzes.tsx'
```

**Why it happens:**
- React Router analyzes imports
- Top-level imports could be bundled for client
- `.server.ts` files must never reach client

**Solution:** Only import server code inside loaders/actions

```typescript
// ❌ BAD - Top level import
import { ObjectId } from "~/lib/db.server";

export async function loader() {
  // ObjectId not used here
}

// ✅ GOOD - Only import what's needed
import { getCollection } from "~/lib/db.server";

export async function loader() {
  const collection = await getCollection('quizzes');
  // ...
}
```

### 3. ObjectId vs String Comparison

**Problem:** ObjectId comparisons fail with `===`

**Why:**
```typescript
const userId = new ObjectId("507f1f77bcf86cd799439011");
const resultUserId = new ObjectId("507f1f77bcf86cd799439011");

userId === resultUserId  // false! (different object references)
```

**Solution:** Convert to string for comparison

```typescript
userId.toString() === resultUserId.toString()  // true!

// Or in our case:
if (result.userId.toString() !== user._id) {
  throw new Response("Forbidden", { status: 403 });
}
```

### 4. Hidden Input for Dynamic State

**Problem:** React state doesn't sync with FormData

**Solution:** Hidden input with JSON value

```typescript
<input type="hidden" name="questions" value={JSON.stringify(questions)} />
```

**Why this works:**
- Input re-renders when state changes
- `value` prop always has latest data
- FormData captures it on submit

**Alternative (doesn't work):**
```typescript
// ❌ This doesn't work - FormData is already created
const handleSubmit = (e) => {
  const formData = new FormData(e.currentTarget);
  formData.set('questions', JSON.stringify(questions));
  // FormData is local, not submitted!
};
```

### 5. Ownership Verification Order

**Correct order:**
1. Check authentication (401 Unauthorized)
2. Check resource exists (404 Not Found)
3. Check ownership (403 Forbidden)

**Why this order:**
- Don't leak resource existence to unauthenticated users
- Return 404 for non-existent resources (even if user doesn't own it)
- Only check ownership if resource exists

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to Protect Actions

```typescript
// ❌ BAD
export async function loader({ request }) {
  await requireUser(request);  // Loader protected
  // ...
}

export async function action({ request }) {
  // Action NOT protected - security hole!
  const formData = await request.formData();
  // ...
}
```

```typescript
// ✅ GOOD
export async function action({ request }) {
  await requireUser(request);  // Action protected too
  const formData = await request.formData();
  // ...
}
```

### ❌ Pitfall 2: Comparing ObjectIds Directly

```typescript
// ❌ BAD
if (result.userId !== user._id) {
  throw new Response("Forbidden", { status: 403 });
}
```

```typescript
// ✅ GOOD
if (result.userId.toString() !== user._id) {
  throw new Response("Forbidden", { status: 403 });
}
```

### ❌ Pitfall 3: Server-Only Imports at Top Level

```typescript
// ❌ BAD - ObjectId imported but not used in loader/action
import { getCollection, ObjectId } from "~/lib/db.server";

export function meta() {
  return [{ title: "Quizzes" }];
}
```

```typescript
// ✅ GOOD - Only import what's used in server functions
import { getCollection } from "~/lib/db.server";

export async function loader() {
  const collection = await getCollection('quizzes');
  // ...
}
```

### ❌ Pitfall 4: Not Handling redirectTo

```typescript
// ❌ BAD - Always redirects to home
export async function action({ request }) {
  const user = await verifyLogin(email, password);
  return createUserSession(user._id.toString(), '/');  // Always home
}
```

```typescript
// ✅ GOOD - Redirect to intended destination
export async function action({ request }) {
  const formData = await request.formData();
  const redirectTo = String(formData.get('redirectTo') || '/');
  
  const user = await verifyLogin(email, password);
  return createUserSession(user._id.toString(), redirectTo);
}
```

---

## Testing & Verification

### Manual Test Cases

#### ✅ Test 1: Public Route Access
- Navigate to `/quizzes` without login
- **Expected:** Page loads, shows quiz list

#### ✅ Test 2: Protected Route Redirect
- Navigate to `/progress` without login
- **Expected:** Redirect to `/auth/login?redirectTo=/progress`

#### ✅ Test 3: Login with Redirect
- Click protected route → redirected to login
- Log in with valid credentials
- **Expected:** Redirect back to original route

#### ✅ Test 4: Ownership Verification
- User A takes quiz, gets result ID
- User B tries to access User A's result
- **Expected:** 403 Forbidden

#### ✅ Test 5: Admin Route Protection
- Log in as regular user
- Navigate to `/admin/quizzes`
- **Expected:** 403 Forbidden

#### ✅ Test 6: Admin Access
- Log in as admin user
- Navigate to `/admin/quizzes`
- **Expected:** Page loads, shows admin panel

#### ✅ Test 7: Quiz Creation
- Log in as admin
- Create quiz with multiple questions
- **Expected:** Quiz saved, redirects to quiz list

#### ✅ Test 8: Quiz Editing
- Log in as admin
- Edit existing quiz, add/remove questions
- **Expected:** Changes saved, redirects to quiz list

---

## Summary

Phase 5 successfully implemented a complete authentication and authorization system for the wellness tracker application. We protected user routes with authentication checks, admin routes with role-based authorization, and implemented ownership verification for user-specific data.

Additionally, we built a comprehensive admin quiz editor with dynamic question management, supporting multiple question types and real-time validation.

### Files Modified/Created

**Modified Routes (9 files):**
- `app/root.tsx`
- `app/routes/quizzes.tsx`
- `app/routes/quizzes.$id.tsx`
- `app/routes/results.$id.tsx`
- `app/routes/progress.tsx`
- `app/routes/admin.tsx`
- `app/routes/admin.quizzes.tsx`
- `app/routes/admin.quizzes.new.tsx`
- `app/routes/admin.quizzes.$id.edit.tsx`

**New Components (1 file):**
- `app/components/QuestionEditor.tsx`

**Type Updates (1 file):**
- `app/types/result.ts`

**Scripts (1 file):**
- `scripts/seed.ts`

### Next Steps

**Phase 6:** User-Specific Data & Progress Tracking
- ✅ Results already linked to users
- ✅ Progress already filtered by user
- ⏳ Add trend visualization
- ⏳ Add comparison across attempts

**Phase 7:** Polish & Production Readiness
- Error boundaries
- Loading states
- 404 page
- SEO optimization
- Accessibility improvements

---

**Phase 5 Complete!** 🎉
