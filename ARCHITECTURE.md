# React Router Framework Architecture Guide

## Table of Contents
1. [Server vs Client Execution](#server-vs-client-execution)
2. [Loaders & Actions Pattern](#loaders--actions-pattern)
3. [Route-Based Architecture](#route-based-architecture)
4. [Folder Structure Explained](#folder-structure-explained)
5. [Data Flow Patterns](#data-flow-patterns)
6. [TypeScript Integration](#typescript-integration)
7. [Common Patterns](#common-patterns)

---

## Server vs Client Execution

Understanding where code runs is **critical** in React Router Framework.

### Server-Side (Node.js)

**What runs here:**
- ✅ Loaders (data fetching)
- ✅ Actions (mutations)
- ✅ `*.server.ts` files
- ✅ Database connections
- ✅ API calls to external services
- ✅ Environment variables

**Why it matters:**
- Direct database access (no API layer needed)
- Secure (credentials never exposed to client)
- Fast (no network roundtrip for data)
- SEO-friendly (content rendered on server)

**Example:**
```typescript
// app/lib/db.server.ts
// The .server.ts suffix ensures this NEVER ships to browser
export async function getDb() {
  const client = new MongoClient(process.env.MONGODB_URI);
  // This code runs in Node.js only
}
```

### Client-Side (Browser)

**What runs here:**
- ✅ React components (after hydration)
- ✅ Event handlers (onClick, onChange, etc.)
- ✅ Client-side state (useState, useReducer)
- ✅ Browser APIs (localStorage, fetch, etc.)

**Why it matters:**
- Interactive UI
- Client-side navigation (no full page reload)
- Real-time updates

**Example:**
```typescript
// app/components/QuizCard.tsx
export function QuizCard({ quiz }: { quiz: Quiz }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // This state lives in the browser
  return <div onClick={() => setIsExpanded(!isExpanded)}>...</div>;
}
```

### Both (Isomorphic)

**What runs on both:**
- ✅ React components (SSR on server, hydration on client)
- ✅ Validation logic (shared between server and client)
- ✅ Type definitions
- ✅ Utility functions (date formatting, etc.)

**Why it matters:**
- Server renders initial HTML (fast first paint)
- Client hydrates and takes over (interactive)
- Code reuse (DRY principle)

**Example:**
```typescript
// app/routes/quizzes.tsx
export default function Quizzes({ loaderData }) {
  // This component renders:
  // 1. On SERVER during SSR (initial request)
  // 2. On CLIENT during hydration (becomes interactive)
  return <div>{loaderData.quizzes.map(...)}</div>;
}
```

---

## Loaders & Actions Pattern

This is the **core** of React Router Framework. Master this, and you master the framework.

### Loaders: Server-Side Data Fetching

**Purpose:** Fetch data BEFORE rendering the component.

**Key Benefits:**
- ❌ No loading states needed
- ❌ No `useEffect` for data fetching
- ❌ No waterfall requests
- ✅ Data is ready immediately
- ✅ Type-safe with TypeScript
- ✅ Automatic revalidation

**Execution Flow:**
```
1. User navigates to /quizzes
2. LOADER runs on server
3. Data is fetched from MongoDB
4. Data is serialized to JSON
5. COMPONENT renders with data (SSR)
6. HTML sent to browser
7. React hydrates with same data
```

**Example:**
```typescript
// app/routes/quizzes.tsx
export async function loader({}: Route.LoaderArgs) {
  // Runs on SERVER (Node.js)
  const quizzes = await getCollection<Quiz>('quizzes');
  const data = await quizzes.find({}).toArray();
  return { quizzes: data }; // Serialized to JSON
}

export default function Quizzes({ loaderData }: Route.ComponentProps) {
  // loaderData is type-safe and ready!
  const { quizzes } = loaderData;
  return <div>{quizzes.map(...)}</div>;
}
```

**When to use:**
- Fetching data from database
- Calling external APIs
- Reading files from filesystem
- Any async operation needed before render

### Actions: Server-Side Mutations

**Purpose:** Handle form submissions and data mutations.

**Key Benefits:**
- ❌ No `fetch` in event handlers
- ❌ No manual state management for forms
- ✅ Progressive enhancement (works without JS!)
- ✅ Automatic revalidation after mutation
- ✅ Built-in error handling

**Execution Flow:**
```
1. User submits form
2. ACTION runs on server
3. Data is validated
4. Database is updated
5. Redirect or return errors
6. Loaders rerun automatically (revalidation)
```

**Example:**
```typescript
// app/routes/quizzes.$id.tsx
export async function action({ request, params }: Route.ActionArgs) {
  // Runs on SERVER when form is submitted
  const formData = await request.formData();
  const answers = extractAnswers(formData);
  
  // Save to database
  const results = await getCollection<QuizResult>('results');
  const result = await results.insertOne({
    quizId: new ObjectId(params.id),
    answers,
    score: calculateScore(answers),
    completedAt: new Date(),
  });
  
  // Redirect to results page
  return redirect(`/results/${result.insertedId}`);
}

export default function TakeQuiz({ loaderData }) {
  return (
    <Form method="post">
      {/* Form fields */}
      <button type="submit">Submit</button>
    </Form>
  );
}
```

**When to use:**
- Form submissions
- Creating/updating/deleting data
- Any mutation operation

### Loader vs Action Decision Tree

```
Need to READ data?
  └─> Use LOADER

Need to WRITE/UPDATE/DELETE data?
  └─> Use ACTION

Need both?
  └─> Use LOADER for initial data
  └─> Use ACTION for mutations
  └─> Loader reruns automatically after action
```

---

## Route-Based Architecture

React Router Framework uses **file-based routing** with a specific naming convention.

### Route File Naming

| File Name | URL | Description |
|-----------|-----|-------------|
| `home.tsx` | `/` | Homepage |
| `quizzes.tsx` | `/quizzes` | Quiz listing |
| `quizzes.$id.tsx` | `/quizzes/:id` | Dynamic quiz route |
| `admin.tsx` | `/admin/*` | Admin layout (wraps children) |
| `admin.quizzes.tsx` | `/admin/quizzes` | Admin quiz list |
| `admin.quizzes.new.tsx` | `/admin/quizzes/new` | Create quiz |
| `admin.quizzes.$id.edit.tsx` | `/admin/quizzes/:id/edit` | Edit quiz |

### Layout Routes

Layout routes wrap child routes and provide shared UI.

**Example:**
```typescript
// app/routes/admin.tsx
export default function AdminLayout() {
  return (
    <div>
      <nav>{/* Admin navigation */}</nav>
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
```

**URL Hierarchy:**
```
/admin                    → admin.tsx (layout)
/admin/quizzes            → admin.tsx + admin.quizzes.tsx
/admin/quizzes/new        → admin.tsx + admin.quizzes.new.tsx
/admin/quizzes/123/edit   → admin.tsx + admin.quizzes.$id.edit.tsx
```

### Dynamic Routes

Use `$` prefix for dynamic segments.

**Example:**
```typescript
// app/routes/quizzes.$id.tsx
export async function loader({ params }: Route.LoaderArgs) {
  const quizId = params.id; // Type-safe!
  const quiz = await fetchQuiz(quizId);
  return { quiz };
}
```

---

## Folder Structure Explained

```
app/
├── routes/                    # Route modules (URL → file mapping)
│   ├── home.tsx              # / (homepage)
│   ├── quizzes.tsx           # /quizzes (list)
│   ├── quizzes.$id.tsx       # /quizzes/:id (take quiz)
│   ├── results.$id.tsx       # /results/:id (view results)
│   ├── progress.tsx          # /progress (user progress)
│   ├── admin.tsx             # /admin/* (layout)
│   ├── admin.quizzes.tsx     # /admin/quizzes (admin list)
│   ├── admin.quizzes.new.tsx # /admin/quizzes/new (create)
│   └── admin.quizzes.$id.edit.tsx # /admin/quizzes/:id/edit
│
├── lib/                       # Server-side utilities
│   └── db.server.ts          # MongoDB connection (SERVER ONLY)
│
├── types/                     # TypeScript type definitions
│   ├── quiz.ts               # Quiz types
│   └── result.ts             # Result types
│
├── components/                # Reusable UI components
│   ├── QuizCard.tsx          # Quiz card component
│   └── QuestionForm.tsx      # Question form component
│
├── root.tsx                   # Root layout (HTML shell)
└── routes.ts                  # Route configuration
```

### Why This Structure?

**`routes/`**: Each file = a URL
- Clear mapping between URLs and code
- Easy to find route logic
- Automatic code splitting

**`lib/*.server.ts`**: Server-only code
- `.server.ts` suffix prevents client bundling
- Safe for database credentials
- No accidental exposure

**`types/`**: Shared types
- Used by both server (loaders) and client (components)
- Single source of truth
- Type safety across boundaries

**`components/`**: Reusable UI
- Shared across routes
- No business logic (that's in loaders/actions)
- Pure presentation

---

## Data Flow Patterns

### Pattern 1: Simple Read (Loader Only)

```typescript
// app/routes/quizzes.tsx
export async function loader() {
  const quizzes = await db.collection('quizzes').find({}).toArray();
  return { quizzes };
}

export default function Quizzes({ loaderData }) {
  return <div>{loaderData.quizzes.map(...)}</div>;
}
```

**Flow:**
```
Request → Loader (fetch) → Component (render) → Response
```

### Pattern 2: Create (Action + Redirect)

```typescript
// app/routes/admin.quizzes.new.tsx
export async function action({ request }) {
  const formData = await request.formData();
  const quiz = await db.collection('quizzes').insertOne({
    title: formData.get('title'),
    // ...
  });
  return redirect('/admin/quizzes');
}

export default function NewQuiz() {
  return <Form method="post">{/* form fields */}</Form>;
}
```

**Flow:**
```
Form Submit → Action (create) → Redirect → Loader (revalidate)
```

### Pattern 3: Edit (Loader + Action)

```typescript
// app/routes/admin.quizzes.$id.edit.tsx
export async function loader({ params }) {
  const quiz = await db.collection('quizzes').findOne({ _id: params.id });
  return { quiz };
}

export async function action({ request, params }) {
  const formData = await request.formData();
  await db.collection('quizzes').updateOne(
    { _id: params.id },
    { $set: { title: formData.get('title') } }
  );
  return redirect('/admin/quizzes');
}

export default function EditQuiz({ loaderData }) {
  return (
    <Form method="post">
      <input name="title" defaultValue={loaderData.quiz.title} />
    </Form>
  );
}
```

**Flow:**
```
Request → Loader (fetch) → Component (pre-fill form) → User edits → 
Form Submit → Action (update) → Redirect → Loader (revalidate)
```

### Pattern 4: Multi-Intent Actions

```typescript
export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get('intent');
  
  if (intent === 'delete') {
    await db.collection('quizzes').deleteOne({ _id: formData.get('id') });
  }
  
  if (intent === 'publish') {
    await db.collection('quizzes').updateOne(
      { _id: formData.get('id') },
      { $set: { isPublished: true } }
    );
  }
  
  return redirect('/admin/quizzes');
}
```

**Usage:**
```typescript
<Form method="post">
  <input type="hidden" name="intent" value="delete" />
  <input type="hidden" name="id" value={quiz._id} />
  <button type="submit">Delete</button>
</Form>
```

---

## TypeScript Integration

React Router Framework has **excellent** TypeScript support.

### Type-Safe Loaders

```typescript
import type { Route } from "./+types/quizzes";

export async function loader({}: Route.LoaderArgs) {
  return { quizzes: [...] };
}

export default function Quizzes({ loaderData }: Route.ComponentProps) {
  // loaderData.quizzes is fully typed!
  loaderData.quizzes.map(quiz => quiz.title); // ✅ Type-safe
}
```

### Type-Safe Params

```typescript
import type { Route } from "./+types/quizzes.$id";

export async function loader({ params }: Route.LoaderArgs) {
  params.id; // ✅ Type-safe (string)
}
```

### Type-Safe Actions

```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  // Validate and type-cast
  const title = String(formData.get('title'));
  return { errors: { title: 'Required' } };
}

export default function Component({ actionData }: Route.ComponentProps) {
  actionData?.errors?.title; // ✅ Type-safe
}
```

---

## Common Patterns

### Error Handling

```typescript
export async function loader({ params }: Route.LoaderArgs) {
  const quiz = await db.collection('quizzes').findOne({ _id: params.id });
  
  if (!quiz) {
    throw new Response("Quiz not found", { status: 404 });
  }
  
  return { quiz };
}
```

### Form Validation

```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const errors: Record<string, string> = {};
  
  if (!formData.get('title')) {
    errors.title = 'Title is required';
  }
  
  if (Object.keys(errors).length > 0) {
    return { errors }; // Return to component
  }
  
  // Proceed with mutation
  await createQuiz(formData);
  return redirect('/quizzes');
}
```

### Data Serialization

MongoDB documents contain `ObjectId` and `Date` objects that need serialization:

```typescript
export async function loader() {
  const quiz = await db.collection('quizzes').findOne({ _id: id });
  
  return {
    quiz: {
      ...quiz,
      _id: quiz._id.toString(), // ObjectId → string
      createdAt: quiz.createdAt.toISOString(), // Date → string
    }
  };
}
```

---

## Key Takeaways

1. **Loaders fetch, Actions mutate** - This is the golden rule
2. **Server code stays on server** - Use `.server.ts` suffix
3. **No loading states** - Data is ready before component renders
4. **Progressive enhancement** - Forms work without JavaScript
5. **Type safety everywhere** - TypeScript integration is excellent
6. **Route-based architecture** - File = URL, simple mental model

---

## Next Steps

Now that you understand the architecture:

1. **Implement features** - Add quiz questions, scoring logic, etc.
2. **Add authentication** - Protect admin routes
3. **Improve UX** - Add optimistic UI, pending states
4. **Deploy** - Ship to production!

Remember: **Master loaders and actions, and you master React Router Framework.**
