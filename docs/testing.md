# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.

## Table of Contents

- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Writing Tests](#writing-tests)
  - [Utility Functions](#utility-functions)
  - [Component Tests](#component-tests)
  - [Route Tests](#route-tests)
- [Mocking Strategies](#mocking-strategies)
  - [Using vi.hoisted](#using-vihoisted)
  - [Mocking Database Operations](#mocking-database-operations)
  - [Mocking React Router](#mocking-react-router)
- [Type Safety in Tests](#type-safety-in-tests)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Running Tests

To run all unit tests:

```bash
npm test
# or
npx vitest run
```

To run tests in watch mode (re-runs on file changes):

```bash
npx vitest
```

To run a specific test file:

```bash
npm test path/to/file.test.tsx
```

To run tests with coverage:

```bash
npx vitest run --coverage
```

## Project Structure

- **Unit Tests**: Located alongside the source files. Naming convention: `filename.test.ts` or `filename.test.tsx`.
- **Setup**: `vitest.config.ts` handles configuration, and `test/setup.ts` handles global test environment setup (like `jest-dom` matchers).
- **Coverage**: Coverage reports are generated in the `coverage/` directory.

## Writing Tests

### Utility Functions

Extract complex logic from components or route handlers into pure utility functions to make them easier to test.

**Example**: `app/utils/quiz-validation.ts` contains the logic for validating quiz data, which is tested in `app/utils/quiz-validation.test.ts`.

```typescript
import { validateQuiz } from "./quiz-validation";

describe("validateQuiz", () => {
  it("should invalidate empty title", () => {
    const result = validateQuiz("", "desc", [], []);
    expect(result.isValid).toBe(false);
  });

  it("should validate complete quiz", () => {
    const result = validateQuiz(
      "Valid Title",
      "Valid Description",
      [{ id: "1", text: "Q1", options: ["A", "B"] }],
      [{ min: 0, max: 10, label: "Low" }]
    );
    expect(result.isValid).toBe(true);
  });
});
```

### Component Tests

Use `@testing-library/react` to render components and assert on their output. Files are located alongside components, e.g., `app/components/QuestionEditor.test.tsx`.

**Basic Component Test**:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionEditor } from './QuestionEditor';

describe('QuestionEditor', () => {
  const mockQuestion = {
    id: '1',
    text: 'Test Question',
    type: 'multiple-choice',
    options: ['Yes', 'No'],
    scoreMapping: {}
  };

  const mockOnChange = vi.fn();

  it('renders question text input', () => {
    render(
      <QuestionEditor
        question={mockQuestion}
        index={0}
        onChange={mockOnChange}
        onRemove={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    const input = screen.getByDisplayValue('Test Question');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when text updates', () => {
    render(
      <QuestionEditor
        question={mockQuestion}
        index={0}
        onChange={mockOnChange}
        onRemove={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    const input = screen.getByDisplayValue('Test Question');
    fireEvent.change(input, { target: { value: 'New Text' } });

    expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({
      text: 'New Text'
    }));
  });
});
```

**Key Testing Library Queries**:

- `getByText()` - Find element by text content
- `getByDisplayValue()` - Find input by its value
- `getByRole()` - Find by ARIA role (preferred for accessibility)
- `getByLabelText()` - Find input by associated label
- `queryBy*()` - Same as `getBy*` but returns null instead of throwing
- `getAllBy*()` - Returns array of all matching elements

### Route Tests

React Router routes require special handling to test both the loader function and the component.

**Testing Loaders**:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader } from "./quizzes";

// Mock dependencies using vi.hoisted
const mocks = vi.hoisted(() => ({
  getCollection: vi.fn(),
  ObjectId: class {
    id: string | number;
    constructor(id: string | number) {
      this.id = id;
    }
    toString() {
      return String(this.id);
    }
  },
}));

vi.mock("~/lib/db.server", () => ({
  getCollection: mocks.getCollection,
  ObjectId: mocks.ObjectId,
}));

describe("Quizzes Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loader", () => {
    it("returns empty list when no published quizzes exist", async () => {
      const mockCollection = {
        find: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      };

      mocks.getCollection.mockResolvedValue(mockCollection);

      const result = await loader();

      expect(mocks.getCollection).toHaveBeenCalledWith("quizzes");
      expect(mockCollection.find).toHaveBeenCalledWith({ isPublished: true });
      expect(result.quizzes).toEqual([]);
    });
  });
});
```

**Testing Route Components**:

```typescript
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import React from 'react';
import Quizzes from './quizzes';
import type { Route } from './+types/quizzes';

describe('Component', () => {
  it('renders empty state when no quizzes available', () => {
    const router = createMemoryRouter([
      {
        path: '/quizzes',
        element: <Quizzes {...{
          loaderData: { quizzes: [] },
          params: {},
          matches: []
        } as unknown as Route.ComponentProps} />
      }
    ], { initialEntries: ['/quizzes'] });

    render(<RouterProvider router={router} />);

    expect(screen.getByText('No quizzes available yet.')).toBeInTheDocument();
  });
});
```

## Mocking Strategies

### Using vi.hoisted

`vi.hoisted()` ensures mocks are available before module imports. This is **critical** for mocking dependencies.

```typescript
// ✅ CORRECT: Use vi.hoisted for mocks
const mocks = vi.hoisted(() => ({
  getCollection: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("~/lib/db.server", () => ({
  getCollection: mocks.getCollection,
}));

// ❌ WRONG: Don't define mocks after vi.mock
vi.mock("~/lib/db.server", () => ({
  getCollection: mockGetCollection, // This won't work!
}));
const mockGetCollection = vi.fn();
```

### Mocking Database Operations

**MongoDB Collection Mocking**:

```typescript
const mocks = vi.hoisted(() => ({
  getCollection: vi.fn(),
  ObjectId: class {
    id: string | number;
    constructor(id: string | number) {
      this.id = id;
    }
    toString() {
      return String(this.id);
    }
    equals(other: string | number | { id: string | number }) {
      return (
        String(this.id) === String(typeof other === "object" ? other.id : other)
      );
    }
  },
}));

vi.mock("~/lib/db.server", () => ({
  getCollection: mocks.getCollection,
  ObjectId: mocks.ObjectId,
}));

// In your test
const mockFind = vi.fn();
const mockSort = vi.fn();
const mockToArray = vi.fn();

const mockCollection = {
  find: mockFind.mockReturnThis(),
  sort: mockSort.mockReturnThis(),
  toArray: mockToArray,
  findOne: vi.fn(),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
  deleteOne: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();

  // Setup method chaining
  mockFind.mockReturnValue({
    sort: mockSort.mockReturnValue({
      toArray: mockToArray,
    }),
  });

  mocks.getCollection.mockResolvedValue(mockCollection);
});
```

**Testing Database Queries**:

```typescript
it("queries database correctly", async () => {
  const mockData = [{ _id: new mocks.ObjectId("1"), title: "Test" }];

  mockToArray.mockResolvedValue(mockData);

  const result = await loader();

  expect(mockFind).toHaveBeenCalledWith({ isPublished: true });
  expect(mockSort).toHaveBeenCalledWith({ order: 1, createdAt: -1 });
  expect(result.quizzes).toHaveLength(1);
});
```

### Mocking React Router

**Mocking Authentication**:

```typescript
const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
}));

vi.mock("~/lib/auth.server", () => ({
  requireUser: mocks.requireUser,
}));

it("requires authentication", async () => {
  const mockUser = { _id: "user1", email: "test@example.com" };
  mocks.requireUser.mockResolvedValue(mockUser);

  const request = new Request("http://localhost/progress");
  const result = await loader({ request, params: {}, context: {} });

  expect(mocks.requireUser).toHaveBeenCalledWith(request);
});
```

**Mocking Session Storage**:

```typescript
const { mockSession, mockStorage } = vi.hoisted(() => ({
  mockSession: {
    get: vi.fn(),
    set: vi.fn(),
    destroy: vi.fn(),
  },
  mockStorage: {
    getSession: vi.fn(),
    commitSession: vi.fn(),
    destroySession: vi.fn(),
  },
}));

vi.mock("react-router", () => ({
  createCookieSessionStorage: vi.fn(() => mockStorage),
  redirect: vi.fn((url, init) => {
    const headers = new Headers(init?.headers);
    return { status: 302, headers, url };
  }),
}));
```

## Type Safety in Tests

### Avoid `any` Types

Always use proper TypeScript types in tests. This catches errors early and improves test reliability.

```typescript
// ❌ BAD: Using any
const mockOnChange = vi.fn() as any;

// ✅ GOOD: Proper typing
import type { Mock } from "vitest";
import type { Question } from "~/types/quiz";

const mockOnChange = vi.fn() as Mock<
  (index: number, question: Question) => void
>;
```

### Type Route Props

```typescript
import type { Route } from './+types/quizzes';

// ✅ Properly typed component props
const props = {
  loaderData: { quizzes: [] },
  params: {},
  matches: []
} as unknown as Route.ComponentProps;

render(<Quizzes {...props} />);
```

### Mock Type-Safe Data

```typescript
import type { User, SerializedUser } from "~/types/user";
import type { ObjectId } from "mongodb";

const mockDbUser: User = {
  _id: { toString: () => "123" } as unknown as ObjectId,
  email: "test@example.com",
  passwordHash: "hash",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSerializedUser: SerializedUser = {
  _id: "123",
  email: "test@example.com",
  role: "user",
  createdAt: mockDbUser.createdAt.toISOString(),
  updatedAt: mockDbUser.updatedAt.toISOString(),
};
```

## Common Patterns

### Testing Empty States

```typescript
it('renders empty state when no data', () => {
  render(<Component data={[]} />);

  expect(screen.getByText('No items available')).toBeInTheDocument();
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
});
```

### Testing Multiple Items

```typescript
it('renders multiple items', () => {
  const items = [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' }
  ];

  render(<ItemList items={items} />);

  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 2')).toBeInTheDocument();
});
```

### Testing User Interactions

```typescript
it('handles button click', () => {
  const mockHandler = vi.fn();
  render(<Button onClick={mockHandler}>Click me</Button>);

  const button = screen.getByText('Click me');
  fireEvent.click(button);

  expect(mockHandler).toHaveBeenCalledTimes(1);
});
```

### Testing Forms

```typescript
it('submits form with correct data', () => {
  const mockSubmit = vi.fn();
  render(<Form onSubmit={mockSubmit} />);

  const input = screen.getByLabelText('Name');
  fireEvent.change(input, { target: { value: 'John' } });

  const submitButton = screen.getByRole('button', { name: /submit/i });
  fireEvent.click(submitButton);

  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'John' })
  );
});
```

### Testing Conditional Rendering

```typescript
it('renders optional fields when provided', () => {
  const quiz = {
    title: 'Test',
    baseTestName: 'GAD-7',
    coverImage: '/image.jpg'
  };

  render(<QuizCard quiz={quiz} />);

  expect(screen.getByText('Based on: GAD-7')).toBeInTheDocument();
  expect(screen.getByAltText('Test')).toHaveAttribute('src', '/image.jpg');
});

it('hides optional fields when not provided', () => {
  const quiz = {
    title: 'Test',
    baseTestName: undefined,
    coverImage: undefined
  };

  render(<QuizCard quiz={quiz} />);

  expect(screen.queryByText(/Based on:/)).not.toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
```

### Testing Serialization

```typescript
it("serializes MongoDB ObjectId to string", async () => {
  const mockQuizzes = [
    {
      _id: new mocks.ObjectId("507f1f77bcf86cd799439011"),
      title: "Test Quiz",
      // ... other fields
    },
  ];

  mockToArray.mockResolvedValue(mockQuizzes);

  const result = await loader();

  expect(typeof result.quizzes[0]._id).toBe("string");
  expect(result.quizzes[0]._id).toBe("507f1f77bcf86cd799439011");
});
```

## Troubleshooting

### "'React' must be in scope when using JSX"

**Problem**: Getting this error even though you're using React 17+.

**Solution**: Import React explicitly in test files:

```typescript
import React from "react";
```

### "Unexpected any. Specify a different type"

**Problem**: ESLint complains about `any` types in tests.

**Solution**: Use proper TypeScript types:

```typescript
// ❌ BAD
const mock = vi.fn() as any;

// ✅ GOOD
import type { Mock } from "vitest";
const mock = vi.fn() as Mock<(arg: string) => void>;
```

### "Source has 0 element(s) but target requires X"

**Problem**: Type mismatch in route component props, especially with `matches` array.

**Solution**: Provide properly typed mock data:

```typescript
const props = {
  loaderData: {
    /* ... */
  },
  params: {},
  matches: [], // Or provide full matches array if needed
} as unknown as Route.ComponentProps;
```

### Mock Not Working / "X is not a function"

**Problem**: Mock is undefined or not a function.

**Solution**: Use `vi.hoisted()` to ensure mocks are available:

```typescript
// ✅ CORRECT
const mocks = vi.hoisted(() => ({
  myFunction: vi.fn(),
}));

vi.mock("~/lib/module", () => ({
  myFunction: mocks.myFunction,
}));
```

### Tests Pass Individually But Fail Together

**Problem**: Tests interfere with each other.

**Solution**: Clear mocks in `beforeEach`:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Reset mock implementations
  mockFunction.mockResolvedValue(defaultValue);
});
```

### "Cannot find module" in Tests

**Problem**: Path aliases not working in tests.

**Solution**: Ensure `vite-tsconfig-paths` is in `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // ...
});
```

### Testing Async Loaders

**Problem**: Loader tests fail with unresolved promises.

**Solution**: Always `await` loader calls and mock async dependencies:

```typescript
it("loads data", async () => {
  mockToArray.mockResolvedValue(mockData); // Use mockResolvedValue

  const result = await loader(); // Don't forget await

  expect(result.data).toEqual(mockData);
});
```

### "toBeInTheDocument is not a function"

**Problem**: Jest-DOM matchers not available.

**Solution**: Ensure `test/setup.ts` imports `@testing-library/jest-dom`:

```typescript
// test/setup.ts
import "@testing-library/jest-dom";
```

---

## Best Practices Summary

1. **Use `vi.hoisted()`** for all mocks to ensure they're available before imports
2. **Clear mocks** in `beforeEach()` to prevent test interference
3. **Type everything** - avoid `any` types in tests
4. **Test behavior, not implementation** - focus on what users see and do
5. **Use semantic queries** - prefer `getByRole()` and `getByLabelText()` for accessibility
6. **Mock at the boundary** - mock external dependencies (DB, APIs) not internal logic
7. **Test edge cases** - empty states, missing data, error conditions
8. **Keep tests focused** - one assertion per test when possible
9. **Use descriptive test names** - "should do X when Y" format
10. **Import React** in test files to avoid JSX scope errors
