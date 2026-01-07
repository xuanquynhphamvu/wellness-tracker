# Phase 2: Loader Deep Dive

## What Are Loaders?

**Loaders** are functions that run **on the server** BEFORE your component renders. They fetch data and make it available to your component immediately—no loading states, no `useEffect`, no waterfall requests.

### The Old Way (Client-Side Fetching)

```typescript
// ❌ DON'T DO THIS in React Router
function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        setQuizzes(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  return <div>{quizzes.map(...)}</div>;
}
```

**Problems:**
- ❌ Loading state needed
- ❌ Waterfall: HTML → JS → API → Data
- ❌ Not SEO-friendly (content not in initial HTML)
- ❌ Slow first paint

### The React Router Way (Server-Side Loaders)

```typescript
// ✅ DO THIS in React Router
export async function loader() {
  const quizzes = await getCollection<Quiz>('quizzes');
  const data = await quizzes.find({}).toArray();
  return { quizzes: data };
}

export default function QuizList({ loaderData }) {
  const { quizzes } = loaderData;
  // Data is ALREADY HERE! No loading state needed!
  return <div>{quizzes.map(...)}</div>;
}
```

**Benefits:**
- ✅ No loading states
- ✅ Data ready immediately
- ✅ SEO-friendly (content in HTML)
- ✅ Fast first paint

---

## Loader Execution Context

### Where Loaders Run

```
┌─────────────────────────────────────────┐
│         SERVER (Node.js)                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  LOADER FUNCTION                  │ │
│  │  - Database queries               │ │
│  │  - API calls                      │ │
│  │  - File system access             │ │
│  │  - Environment variables          │ │
│  └───────────────────────────────────┘ │
│                 ↓                       │
│  ┌───────────────────────────────────┐ │
│  │  COMPONENT (SSR)                  │ │
│  │  - Renders with loaderData        │ │
│  │  - Generates HTML                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 ↓
        HTML sent to browser
                 ↓
┌─────────────────────────────────────────┐
│         CLIENT (Browser)                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  COMPONENT (Hydration)            │ │
│  │  - Same loaderData from server    │ │
│  │  - Becomes interactive            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Point:** Loaders NEVER run in the browser. They're server-only.

---

## Pattern 1: Simple Loaders (List Data)

**Example:** [quizzes.tsx](file:///Users/meowiu/wellness-tracker/app/routes/quizzes.tsx)

### The Code

```typescript
export async function loader({ }: Route.LoaderArgs) {
    // 🔴 SERVER-SIDE ONLY
    const quizzes = await getCollection<Quiz>('quizzes');
    const allQuizzes = await quizzes
        .find({ isPublished: true })
        .sort({ createdAt: -1 })
        .toArray();

    // Serialize MongoDB documents
    const serialized: SerializedQuiz[] = allQuizzes.map(quiz => ({
        _id: quiz._id!.toString(),
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
    }));

    return { quizzes: serialized };
}
```

### Execution Flow

```
1. User navigates to /quizzes
   ↓
2. React Router calls loader() on SERVER
   ↓
3. getCollection<Quiz>('quizzes') connects to MongoDB
   ↓
4. .find({ isPublished: true }) queries database
   ↓
5. .toArray() converts cursor to array
   ↓
6. Data serialized (ObjectId → string, Date → ISO string)
   ↓
7. Return { quizzes: serialized }
   ↓
8. Component renders on SERVER with loaderData
   ↓
9. HTML sent to browser
   ↓
10. React hydrates on CLIENT with same loaderData
```

### Why Serialization?

MongoDB returns objects that can't be sent over the network:

```typescript
// ❌ Can't serialize to JSON
{
  _id: ObjectId("507f1f77bcf86cd799439011"),  // Binary object
  createdAt: Date("2024-01-01T00:00:00.000Z") // Date object
}

// ✅ Can serialize to JSON
{
  _id: "507f1f77bcf86cd799439011",  // String
  createdAt: "2024-01-01T00:00:00.000Z" // ISO string
}
```

### Key Learnings

1. **Loaders run on every navigation** - Fresh data every time
2. **No loading states needed** - Data is ready before render
3. **Type-safe** - `loaderData.quizzes` is fully typed
4. **Filters on server** - `{ isPublished: true }` keeps drafts hidden

### When to Use

- Fetching lists of items
- Dashboard data
- Any data that doesn't depend on URL params

---

## Pattern 2: Dynamic Loaders (Single Item by ID)

**Example:** [quizzes.$id.tsx](file:///Users/meowiu/wellness-tracker/app/routes/quizzes.$id.tsx)

### The Code

```typescript
export async function loader({ params }: Route.LoaderArgs) {
    // 🔴 SERVER-SIDE ONLY
    
    // Validate params
    if (!params.id) {
        throw new Response("Quiz ID is required", { status: 400 });
    }

    // Fetch by ID
    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({
        _id: new ObjectId(params.id),
        isPublished: true
    });

    // Handle not found
    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    // Serialize and return
    const serialized: SerializedQuiz = {
        _id: quiz._id!.toString(),
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
    };

    return { quiz: serialized };
}
```

### Execution Flow

```
1. User navigates to /quizzes/507f1f77bcf86cd799439011
   ↓
2. React Router extracts params.id = "507f1f77bcf86cd799439011"
   ↓
3. Loader runs on SERVER with params
   ↓
4. Validate params.id exists
   ↓
5. Convert string to ObjectId
   ↓
6. Query MongoDB: findOne({ _id: ObjectId(...) })
   ↓
7. If not found → throw Response (404)
   ↓
8. If found → serialize and return
   ↓
9. Component renders with quiz data
```

### Error Handling

```typescript
// Throwing a Response triggers error boundaries
throw new Response("Quiz not found", { status: 404 });

// This will:
// 1. Stop loader execution
// 2. Trigger ErrorBoundary component
// 3. Show 404 page to user
```

### Key Learnings

1. **Dynamic routes** use `$id` syntax in filename
2. **params.id** is type-safe (TypeScript knows it exists)
3. **Throwing Response** handles errors gracefully
4. **Validation first** - Check params before querying

### When to Use

- Viewing single items (quiz, result, user profile)
- Edit pages (need to load existing data)
- Any route with dynamic segments

---

## Pattern 3: Aggregated Loaders (Complex Queries)

**Example:** [progress.tsx](file:///Users/meowiu/wellness-tracker/app/routes/progress.tsx)

### The Code

```typescript
export async function loader({ }: Route.LoaderArgs) {
    // Fetch all results
    const results = await getCollection<QuizResult>('results');
    const allResults = await results
        .find({})  // TODO: Filter by userId
        .sort({ completedAt: -1 })
        .toArray();

    // 🔑 KEY: Data aggregation in loader
    const progressByQuiz: Record<string, {
        quizTitle: string;
        results: { date: string; score: number }[];
    }> = {};

    // Group results by quiz
    for (const result of allResults) {
        const quizId = result.quizId.toString();

        if (!progressByQuiz[quizId]) {
            const quizzes = await getCollection<Quiz>('quizzes');
            const quiz = await quizzes.findOne({ _id: result.quizId });
            
            progressByQuiz[quizId] = {
                quizTitle: quiz?.title || 'Unknown Quiz',
                results: [],
            };
        }

        progressByQuiz[quizId].results.push({
            date: result.completedAt.toISOString(),
            score: result.score,
        });
    }

    return { progressByQuiz };
}
```

### Execution Flow

```
1. User navigates to /progress
   ↓
2. Loader fetches ALL results from MongoDB
   ↓
3. For each result:
   - Extract quizId
   - Fetch quiz if not already fetched
   - Group result under quiz
   ↓
4. Return shaped data structure
   ↓
5. Component receives ready-to-render data
```

### Data Shaping

**Before (raw MongoDB data):**
```javascript
[
  { _id: "1", quizId: "abc", score: 80, completedAt: Date(...) },
  { _id: "2", quizId: "abc", score: 85, completedAt: Date(...) },
  { _id: "3", quizId: "xyz", score: 70, completedAt: Date(...) },
]
```

**After (shaped for UI):**
```javascript
{
  "abc": {
    quizTitle: "Stress Assessment",
    results: [
      { date: "2024-01-01", score: 80 },
      { date: "2024-01-02", score: 85 }
    ]
  },
  "xyz": {
    quizTitle: "Anxiety Quiz",
    results: [
      { date: "2024-01-03", score: 70 }
    ]
  }
}
```

### Key Learnings

1. **Shape data in loaders** - Not in components!
2. **Component receives ready-to-render data** - No processing needed
3. **Multiple queries OK** - Loaders can fetch from multiple collections
4. **Data aggregation on server** - Keeps client bundle small

### When to Use

- Dashboards with statistics
- Reports with aggregated data
- Progress tracking
- Any complex data transformations

---

## Pattern 4: Multi-Collection Joins

**Example:** [results.$id.tsx](file:///Users/meowiu/wellness-tracker/app/routes/results.$id.tsx)

### The Code

```typescript
export async function loader({ params }: Route.LoaderArgs) {
    // Fetch result
    const results = await getCollection<QuizResult>('results');
    const result = await results.findOne({ _id: new ObjectId(params.id) });

    if (!result) {
        throw new Response("Result not found", { status: 404 });
    }

    // 🔑 KEY: Join data from another collection
    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({ _id: result.quizId });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    // Return combined data
    return {
        result: serializeResult(result),
        quizTitle: quiz.title,
        maxScore: quiz.questions.length * 10,
    };
}
```

### Why Join on Server?

**❌ Client-side join (bad):**
```typescript
// Component would need to:
// 1. Fetch result
// 2. Extract quizId
// 3. Fetch quiz
// 4. Combine data
// = Multiple renders, loading states, complexity
```

**✅ Server-side join (good):**
```typescript
// Loader does:
// 1. Fetch result
// 2. Fetch quiz
// 3. Return combined data
// = Component gets everything at once
```

### Key Learnings

1. **Join data in loaders** - Not in components
2. **Return calculated fields** - `maxScore` computed on server
3. **Component is simple** - Just renders what it receives

---

## Loader Best Practices

### ✅ DO

1. **Fetch all data needed for the page**
```typescript
export async function loader() {
  const [quizzes, categories, stats] = await Promise.all([
    getQuizzes(),
    getCategories(),
    getStats(),
  ]);
  return { quizzes, categories, stats };
}
```

2. **Validate params early**
```typescript
export async function loader({ params }) {
  if (!params.id) {
    throw new Response("ID required", { status: 400 });
  }
  // Continue...
}
```

3. **Serialize MongoDB objects**
```typescript
return {
  quiz: {
    _id: quiz._id.toString(),  // ObjectId → string
    createdAt: quiz.createdAt.toISOString(),  // Date → ISO string
  }
};
```

4. **Shape data for the UI**
```typescript
// Don't return raw database data
// Shape it for how the component will use it
return {
  stats: {
    total: results.length,
    average: calculateAverage(results),
    trend: calculateTrend(results),
  }
};
```

5. **Use TypeScript**
```typescript
export async function loader({ params }: Route.LoaderArgs) {
  // params is type-safe!
  const id = params.id;  // TypeScript knows this exists
}
```

### ❌ DON'T

1. **Don't use client-side APIs**
```typescript
// ❌ These don't exist on server
localStorage.getItem('token');
window.location.href;
document.querySelector('.element');
```

2. **Don't return functions**
```typescript
// ❌ Functions can't be serialized
return {
  data: results,
  handleClick: () => console.log('click'),  // Error!
};
```

3. **Don't return class instances**
```typescript
// ❌ Class instances can't be serialized
return {
  date: new Date(),  // Error! Use .toISOString()
  id: new ObjectId(),  // Error! Use .toString()
};
```

4. **Don't fetch in components**
```typescript
// ❌ Don't do this
export default function Component({ loaderData }) {
  useEffect(() => {
    fetch('/api/more-data');  // NO! Use loader instead
  }, []);
}
```

5. **Don't forget error handling**
```typescript
// ❌ Bad
const quiz = await quizzes.findOne({ _id: id });
return { quiz };  // What if quiz is null?

// ✅ Good
const quiz = await quizzes.findOne({ _id: id });
if (!quiz) {
  throw new Response("Not found", { status: 404 });
}
return { quiz };
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Serialize

```typescript
// ❌ This will error
export async function loader() {
  const quiz = await quizzes.findOne({ _id: id });
  return { quiz };  // ObjectId can't be serialized!
}

// ✅ Fix
export async function loader() {
  const quiz = await quizzes.findOne({ _id: id });
  return {
    quiz: {
      ...quiz,
      _id: quiz._id.toString(),
      createdAt: quiz.createdAt.toISOString(),
    }
  };
}
```

### Pitfall 2: Not Handling Null

```typescript
// ❌ Component will crash if quiz is null
export async function loader({ params }) {
  const quiz = await quizzes.findOne({ _id: params.id });
  return { quiz };  // quiz might be null!
}

// ✅ Fix
export async function loader({ params }) {
  const quiz = await quizzes.findOne({ _id: params.id });
  if (!quiz) {
    throw new Response("Quiz not found", { status: 404 });
  }
  return { quiz };
}
```

### Pitfall 3: Client-Side Logic in Loaders

```typescript
// ❌ localStorage doesn't exist on server
export async function loader() {
  const token = localStorage.getItem('token');  // Error!
  return { token };
}

// ✅ Fix - Use cookies or sessions
export async function loader({ request }) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  return { token };
}
```

---

## Loader Execution Timeline

```
┌─────────────────────────────────────────────────────────┐
│ User clicks <Link to="/quizzes/123">                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ React Router matches route: quizzes.$id.tsx             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ SERVER: loader({ params: { id: "123" } }) runs          │
│ - Connects to MongoDB                                   │
│ - Queries database                                      │
│ - Serializes data                                       │
│ - Returns { quiz: {...} }                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ SERVER: Component({ loaderData }) renders               │
│ - Generates HTML with quiz data                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ HTML + loaderData sent to browser                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ CLIENT: React hydrates with same loaderData             │
│ - Component becomes interactive                         │
│ - Event handlers attached                               │
└─────────────────────────────────────────────────────────┘
```

**Total time:** ~100-300ms (server-side only)

**Compare to client-side fetching:**
```
HTML load (100ms)
  ↓
JS load (200ms)
  ↓
API call (200ms)
  ↓
Render (50ms)
= 550ms total
```

---

## Summary

### What We Learned

1. **Loaders run on server** - Before component renders
2. **No loading states needed** - Data is ready immediately
3. **Three main patterns:**
   - Simple (list data)
   - Dynamic (single item by ID)
   - Aggregated (complex queries)
4. **Always serialize** - ObjectId → string, Date → ISO string
5. **Shape data in loaders** - Not in components
6. **Error handling** - Throw Response for 404/400 errors

### Key Takeaways

- ✅ Loaders eliminate `useEffect` for data fetching
- ✅ Loaders eliminate loading states
- ✅ Loaders eliminate waterfall requests
- ✅ Loaders make components simpler
- ✅ Loaders are type-safe with TypeScript

### Next: Phase 3 - Action Deep Dive

Now that you understand loaders (READ data), we'll learn about actions (WRITE data).

Actions handle:
- Form submissions
- Creating records
- Updating records
- Deleting records

**Ready to continue?**
