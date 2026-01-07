# Phase 3: Action Deep Dive

## What Are Actions?

**Actions** are functions that run **on the server** when a form is submitted. They handle mutations (create, update, delete) and automatically revalidate loaders after completion.

### The Old Way (Client-Side Mutations)

```typescript
// ❌ DON'T DO THIS in React Router
function CreateQuiz() {
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    await fetch('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    
    setLoading(false);
    navigate('/admin/quizzes');
  }
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Problems:**
- ❌ Manual form handling
- ❌ Manual loading states
- ❌ Manual navigation
- ❌ Manual revalidation
- ❌ Doesn't work without JavaScript

### The React Router Way (Server-Side Actions)

```typescript
// ✅ DO THIS in React Router
export async function action({ request }) {
  const formData = await request.formData();
  const title = formData.get('title');
  
  await quizzes.insertOne({ title, createdAt: new Date() });
  return redirect('/admin/quizzes');
}

export default function CreateQuiz() {
  return (
    <Form method="post">
      <input name="title" />
      <button type="submit">Create</button>
    </Form>
  );
}
```

**Benefits:**
- ✅ Automatic form handling
- ✅ Automatic revalidation
- ✅ Progressive enhancement (works without JS!)
- ✅ Type-safe
- ✅ Simple component

---

## Action Execution Context

```
┌─────────────────────────────────────────┐
│         CLIENT (Browser)                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  User fills form and clicks       │ │
│  │  Submit button                    │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 ↓
        Form data sent to server
                 ↓
┌─────────────────────────────────────────┐
│         SERVER (Node.js)                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  ACTION FUNCTION                  │ │
│  │  - Extract FormData               │ │
│  │  - Validate input                 │ │
│  │  - Database mutation              │ │
│  │  - Return redirect or errors      │ │
│  └───────────────────────────────────┘ │
│                 ↓                       │
│  ┌───────────────────────────────────┐ │
│  │  LOADERS RERUN                    │ │
│  │  - Fetch fresh data               │ │
│  │  - Reflect changes                │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 ↓
        Redirect or render with errors
```

---

## Pattern 1: Create Actions

**Example:** [admin.quizzes.new.tsx](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.new.tsx)

### The Code

```typescript
export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();

    // Extract form fields
    const title = String(formData.get('title'));
    const description = String(formData.get('description'));
    const isPublished = formData.get('isPublished') === 'on';

    // Validate
    if (!title || !description) {
        return {
            errors: {
                title: !title ? 'Title is required' : undefined,
                description: !description ? 'Description is required' : undefined,
            }
        };
    }

    // Extract questions (dynamic form fields)
    const questions: Question[] = [];
    let questionIndex = 0;
    
    while (formData.has(`question_${questionIndex}_text`)) {
        const text = String(formData.get(`question_${questionIndex}_text`));
        const type = String(formData.get(`question_${questionIndex}_type`));
        
        questions.push({
            id: crypto.randomUUID(),
            text,
            type: type as 'multiple-choice' | 'scale' | 'text',
            // ... extract options, scoring, etc.
        });
        
        questionIndex++;
    }

    // Insert into database
    const quizzes = await getCollection<Quiz>('quizzes');
    await quizzes.insertOne({
        title,
        description,
        questions,
        isPublished,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Redirect to admin list
    return redirect('/admin/quizzes');
}
```

### Execution Flow

```
1. User fills out form
   ↓
2. User clicks "Create Quiz"
   ↓
3. <Form method="post"> submits to action
   ↓
4. ACTION runs on SERVER
   ↓
5. Extract FormData
   ↓
6. Validate input
   ↓
7. If errors → return { errors }
   ↓
8. If valid → insert into MongoDB
   ↓
9. Redirect to /admin/quizzes
   ↓
10. admin.quizzes.tsx LOADER reruns automatically
    ↓
11. New quiz appears in list!
```

### FormData Handling

```typescript
// Form in component
<Form method="post">
  <input name="title" />
  <input name="description" />
  <input type="checkbox" name="isPublished" />
</Form>

// Action receives FormData
const formData = await request.formData();
const title = formData.get('title');        // "Stress Quiz"
const description = formData.get('description'); // "Assess your stress"
const isPublished = formData.get('isPublished'); // "on" or null
```

### Validation Pattern

```typescript
// Return errors to component
if (!title) {
    return {
        errors: { title: 'Title is required' }
    };
}

// Component displays errors
export default function Component({ actionData }) {
    return (
        <div>
            <input name="title" />
            {actionData?.errors?.title && (
                <p className="error">{actionData.errors.title}</p>
            )}
        </div>
    );
}
```

### Key Learnings

1. **Actions run on form submission** - `<Form method="post">`
2. **FormData API** - Extract form fields with `.get()`
3. **Validation** - Return errors to component
4. **Redirect after success** - `return redirect('/path')`
5. **Automatic revalidation** - Loaders rerun after action

---

## Pattern 2: Update Actions

**Example:** [admin.quizzes.$id.edit.tsx](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.$id.edit.tsx)

### The Code

```typescript
export async function action({ request, params }: Route.ActionArgs) {
    const quizId = params.id;
    
    if (!quizId) {
        throw new Response("Quiz ID required", { status: 400 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title'));
    const description = String(formData.get('description'));
    const isPublished = formData.get('isPublished') === 'on';

    // Validate
    if (!title || !description) {
        return {
            errors: {
                title: !title ? 'Title is required' : undefined,
                description: !description ? 'Description is required' : undefined,
            }
        };
    }

    // Extract questions (same as create)
    const questions: Question[] = [];
    // ... extract questions logic

    // Update in database
    const quizzes = await getCollection<Quiz>('quizzes');
    const result = await quizzes.updateOne(
        { _id: new ObjectId(quizId) },
        {
            $set: {
                title,
                description,
                questions,
                isPublished,
                updatedAt: new Date(),
            }
        }
    );

    if (result.matchedCount === 0) {
        throw new Response("Quiz not found", { status: 404 });
    }

    return redirect('/admin/quizzes');
}
```

### MongoDB Update Operators

```typescript
// $set - Update specific fields
await quizzes.updateOne(
    { _id: id },
    { $set: { title: "New Title", updatedAt: new Date() } }
);

// $inc - Increment a number
await quizzes.updateOne(
    { _id: id },
    { $inc: { viewCount: 1 } }
);

// $push - Add to array
await quizzes.updateOne(
    { _id: id },
    { $push: { tags: "new-tag" } }
);

// $pull - Remove from array
await quizzes.updateOne(
    { _id: id },
    { $pull: { tags: "old-tag" } }
);
```

### Loader + Action Pattern

```typescript
// LOADER: Fetch existing data
export async function loader({ params }) {
    const quiz = await quizzes.findOne({ _id: new ObjectId(params.id) });
    return { quiz: serializeQuiz(quiz) };
}

// COMPONENT: Pre-fill form
export default function EditQuiz({ loaderData }) {
    return (
        <Form method="post">
            <input name="title" defaultValue={loaderData.quiz.title} />
            <button type="submit">Update</button>
        </Form>
    );
}

// ACTION: Update database
export async function action({ request, params }) {
    const formData = await request.formData();
    await quizzes.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { title: formData.get('title') } }
    );
    return redirect('/admin/quizzes');
}
```

### Key Learnings

1. **Loader fetches, action updates** - Clear separation
2. **defaultValue** - Pre-fill forms with existing data
3. **MongoDB $set** - Update only specified fields
4. **Check matchedCount** - Verify document exists

---

## Pattern 3: Delete Actions

**Example:** [admin.quizzes.tsx](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.tsx) (multi-intent action)

### The Code

```typescript
export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent');
    const quizId = formData.get('quizId');

    if (intent === 'delete' && quizId) {
        const quizzes = await getCollection<Quiz>('quizzes');
        await quizzes.deleteOne({ _id: new ObjectId(String(quizId)) });
        return redirect('/admin/quizzes');
    }

    return null;
}
```

### Component with Delete Form

```typescript
export default function AdminQuizzes({ loaderData }) {
    return (
        <div>
            {loaderData.quizzes.map(quiz => (
                <div key={quiz._id}>
                    <h2>{quiz.title}</h2>
                    
                    <Form method="post">
                        <input type="hidden" name="quizId" value={quiz._id} />
                        <input type="hidden" name="intent" value="delete" />
                        <button
                            type="submit"
                            onClick={(e) => {
                                if (!confirm('Delete this quiz?')) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            Delete
                        </button>
                    </Form>
                </div>
            ))}
        </div>
    );
}
```

### Key Learnings

1. **Hidden inputs** - Pass data to action
2. **Confirmation** - Use `onClick` to confirm
3. **Immediate revalidation** - List updates automatically

---

## Pattern 4: Multi-Intent Actions

**Example:** [admin.quizzes.tsx](file:///Users/meowiu/wellness-tracker/app/routes/admin.quizzes.tsx)

### The Code

```typescript
export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent');
    const quizId = formData.get('quizId');

    // Handle delete
    if (intent === 'delete' && quizId) {
        await quizzes.deleteOne({ _id: new ObjectId(String(quizId)) });
        return redirect('/admin/quizzes');
    }

    // Handle publish/unpublish
    if (intent === 'toggle-publish' && quizId) {
        const quiz = await quizzes.findOne({ _id: new ObjectId(String(quizId)) });
        
        if (quiz) {
            await quizzes.updateOne(
                { _id: new ObjectId(String(quizId)) },
                {
                    $set: {
                        isPublished: !quiz.isPublished,
                        updatedAt: new Date(),
                    }
                }
            );
        }
        return redirect('/admin/quizzes');
    }

    return null;
}
```

### Multiple Forms, One Action

```typescript
// Delete form
<Form method="post">
    <input type="hidden" name="intent" value="delete" />
    <input type="hidden" name="quizId" value={quiz._id} />
    <button type="submit">Delete</button>
</Form>

// Publish form
<Form method="post">
    <input type="hidden" name="intent" value="toggle-publish" />
    <input type="hidden" name="quizId" value={quiz._id} />
    <button type="submit">
        {quiz.isPublished ? 'Unpublish' : 'Publish'}
    </button>
</Form>
```

### Key Learnings

1. **One action, multiple operations** - Use `intent` field
2. **Switch on intent** - Determine which operation to perform
3. **Cleaner than multiple actions** - Easier to maintain

---

## Pattern 5: Quiz Submission Action

**Example:** [quizzes.$id.tsx](file:///Users/meowiu/wellness-tracker/app/routes/quizzes.$id.tsx)

### The Code

```typescript
export async function action({ request, params }: Route.ActionArgs) {
    const formData = await request.formData();
    const quizId = params.id;

    // Get quiz for score calculation
    const quizzes = await getCollection<Quiz>('quizzes');
    const quiz = await quizzes.findOne({ _id: new ObjectId(quizId) });

    if (!quiz) {
        throw new Response("Quiz not found", { status: 404 });
    }

    // Extract answers and calculate score
    const answers: { questionId: string; answer: string | number }[] = [];
    let totalScore = 0;

    quiz.questions.forEach((question) => {
        const answer = formData.get(`question_${question.id}`);

        if (answer) {
            const answerValue = question.type === 'scale'
                ? Number(answer)
                : String(answer);

            answers.push({
                questionId: question.id,
                answer: answerValue,
            });

            // Calculate score based on question type
            if (question.scoreMapping && typeof answerValue === 'string') {
                totalScore += question.scoreMapping[answerValue] || 0;
            } else if (question.type === 'scale' && typeof answerValue === 'number') {
                totalScore += answerValue;
            }
        }
    });

    // Save result
    const results = await getCollection<QuizResult>('results');
    const result = await results.insertOne({
        quizId: new ObjectId(quizId),
        answers,
        score: totalScore,
        completedAt: new Date(),
        // TODO: Add userId when auth is implemented
    });

    // Redirect to results page
    return redirect(`/results/${result.insertedId}`);
}
```

### Dynamic Form Fields

```typescript
// Component renders questions dynamically
{quiz.questions.map((question) => (
    <div key={question.id}>
        <label>{question.text}</label>
        
        {question.type === 'multiple-choice' && (
            question.options?.map(option => (
                <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option}
                />
            ))
        )}
        
        {question.type === 'scale' && (
            <input
                type="range"
                name={`question_${question.id}`}
                min={question.scaleMin}
                max={question.scaleMax}
            />
        )}
    </div>
))}
```

### Key Learnings

1. **Business logic in actions** - Score calculation on server
2. **Dynamic form processing** - Loop through questions
3. **Type conversion** - Number() for scale, String() for text
4. **Redirect to related page** - Show results immediately

---

## Action Best Practices

### ✅ DO

1. **Validate input**
```typescript
export async function action({ request }) {
    const formData = await request.formData();
    const title = formData.get('title');
    
    if (!title || title.length < 3) {
        return { errors: { title: 'Title must be at least 3 characters' } };
    }
    
    // Continue...
}
```

2. **Redirect after success**
```typescript
// ✅ Redirect after mutation
await quizzes.insertOne({ title });
return redirect('/admin/quizzes');

// ❌ Don't just return data
await quizzes.insertOne({ title });
return { success: true };  // User stays on same page
```

3. **Return errors, don't throw**
```typescript
// ✅ Return validation errors
if (!title) {
    return { errors: { title: 'Required' } };
}

// ❌ Don't throw for validation
if (!title) {
    throw new Error('Title required');  // Shows error page
}
```

4. **Use type coercion**
```typescript
// FormData values are always strings or File objects
const title = String(formData.get('title'));
const age = Number(formData.get('age'));
const isPublished = formData.get('isPublished') === 'on';
```

5. **Update timestamps**
```typescript
await quizzes.updateOne(
    { _id: id },
    {
        $set: {
            title: newTitle,
            updatedAt: new Date(),  // ← Always update this
        }
    }
);
```

### ❌ DON'T

1. **Don't forget to await**
```typescript
// ❌ Forgot await
quizzes.insertOne({ title });  // Promise not awaited!
return redirect('/admin/quizzes');  // Redirects before insert completes

// ✅ Await the promise
await quizzes.insertOne({ title });
return redirect('/admin/quizzes');
```

2. **Don't mutate in components**
```typescript
// ❌ Don't do this
export default function Component() {
    async function handleDelete() {
        await fetch('/api/delete', { method: 'DELETE' });
    }
    return <button onClick={handleDelete}>Delete</button>;
}

// ✅ Use actions
export async function action({ request }) {
    const formData = await request.formData();
    if (formData.get('intent') === 'delete') {
        await quizzes.deleteOne({ _id: id });
    }
    return redirect('/admin/quizzes');
}
```

3. **Don't return non-serializable data**
```typescript
// ❌ Can't serialize
return {
    date: new Date(),  // Error!
    id: new ObjectId(),  // Error!
};

// ✅ Serialize first
return {
    date: new Date().toISOString(),
    id: objectId.toString(),
};
```

---

## Form → Action → Redirect Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User fills form and clicks Submit                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. <Form method="post"> sends data to server           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. ACTION runs on server                                │
│    - Extract FormData                                   │
│    - Validate input                                     │
│    - If errors → return { errors }                      │
│    - If valid → mutate database                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Return redirect('/path')                             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Navigate to /path                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. LOADER for /path runs automatically                  │
│    - Fetches fresh data                                 │
│    - Includes the change you just made                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Component renders with updated data                  │
└─────────────────────────────────────────────────────────┘
```

**This is the magic of React Router!** No manual revalidation needed.

---

## Summary

### What We Learned

1. **Actions handle mutations** - Create, update, delete
2. **Actions run on form submission** - `<Form method="post">`
3. **FormData API** - Extract form fields with `.get()`
4. **Validation** - Return errors to component
5. **Redirect after success** - `return redirect('/path')`
6. **Automatic revalidation** - Loaders rerun after actions

### Five Action Patterns

1. **Create** - Insert new document, redirect
2. **Update** - Fetch in loader, update in action
3. **Delete** - Delete document, redirect
4. **Multi-intent** - One action, multiple operations
5. **Complex processing** - Quiz submission with scoring

### Key Takeaways

- ✅ Actions eliminate manual form handling
- ✅ Actions eliminate manual revalidation
- ✅ Actions work without JavaScript (progressive enhancement)
- ✅ Actions are type-safe with TypeScript
- ✅ Actions keep components simple

### Phases 1-3 Complete! 🎉

You now understand:
- ✅ Route architecture
- ✅ Loaders (READ data)
- ✅ Actions (WRITE data)

**Next: Phase 4 - Authentication**

We'll add:
- User registration and login
- Session management
- Route protection
- User-specific data

**Ready to start building?**
