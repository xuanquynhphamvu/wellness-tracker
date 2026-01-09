# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.

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

## Structure

- **Unit Tests**: Located alongside the source files or in `app/utils`. Naming convention: `filename.test.ts`.
- **Setup**: `vitest.config.ts` handles configuration, and `test/setup.ts` handles global test environment setup (like `jest-dom` matchers).

## Writing Tests

### Utility Functions
Extract complex logic from components or route handlers into pure utility functions to make them easier to test.

Example:
`app/utils/quiz-validation.ts` contains the logic for validating quiz data, which is tested in `app/utils/quiz-validation.test.ts`.

```typescript
import { validateQuiz } from './quiz-validation';

describe('validateQuiz', () => {
  it('should invalidate empty title', () => {
    const result = validateQuiz('', 'desc', [], []);
    expect(result.isValid).toBe(false);
  });
});
```

### Component Tests
Use `@testing-library/react` to render components and assert on their output. Files are located alongside components, e.g., `app/components/Button.test.tsx`.

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Server Logic & Mocking
For server-side code with side effects (like database calls), use `vi.mock` and `vi.hoisted` to mock dependencies.

Example (`app/lib/auth.server.test.ts`):

```typescript
import { vi } from 'vitest';
import { createUser } from './auth.server';

// Define mocks first
const { mockInsertOne } = vi.hoisted(() => ({
    mockInsertOne: vi.fn(),
}));

// Mock the module
vi.mock('~/lib/db.server', () => ({
    getCollection: vi.fn().mockResolvedValue({
        insertOne: mockInsertOne,
    }),
}));

test('createUser', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: '123' });
    await createUser('email@example.com', 'password');
    expect(mockInsertOne).toHaveBeenCalled();
});
```
