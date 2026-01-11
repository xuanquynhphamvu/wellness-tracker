# Wellness Tracker - Mental Health Quiz App

A production-ready mental health quiz application built with **React Router Framework v7**, demonstrating best practices for server-side rendering, type-safe data flows, and MongoDB integration.

## 🎯 Purpose

This project serves as both:
1. **A functional mental health quiz tracker** - Users can take quizzes and track progress over time
2. **A learning resource** - Comprehensive examples of React Router Framework patterns

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/wellness-tracker

# Start development server
npm run dev
```

Visit `http://localhost:5173`

## 📁 Project Structure

```
app/
├── routes/              # Route modules (URL → file mapping)
│   ├── home.tsx        # Homepage
│   ├── quizzes.tsx     # Quiz listing (loader example)
│   ├── quizzes.$id.tsx # Take quiz (loader + action example)
│   ├── results.$id.tsx # View results
│   ├── progress.tsx    # Progress tracking
│   └── admin/          # Admin area
│       ├── quizzes.tsx
│       ├── quizzes.new.tsx
│       └── quizzes.$id.edit.tsx
│
├── lib/
│   └── db.server.ts    # MongoDB connection (SERVER ONLY)
│
├── types/              # TypeScript type definitions
│   ├── quiz.ts
│   └── result.ts
│
└── components/         # Reusable UI components
```

## 🎓 Learning Resources

### Architecture Guide

Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) for a comprehensive guide covering:
- Server vs client execution model
- Loaders & actions deep dive
- Route-based architecture
- Data flow patterns
- TypeScript integration

### Key Concepts

**Loaders** - Server-side data fetching
```typescript
export async function loader({ params }: Route.LoaderArgs) {
  const quiz = await getCollection<Quiz>('quizzes').findOne({ _id: params.id });
  return { quiz }; // Data ready before component renders!
}
```

**Actions** - Server-side mutations
```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await saveQuizResult(formData);
  return redirect('/results/123'); // Redirect after success
}
```

**Progressive Enhancement** - Forms work without JavaScript
```typescript
<Form method="post">
  <input name="answer" />
  <button type="submit">Submit</button>
</Form>
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server with HMR

# Type Checking
npm run typecheck    # Run TypeScript compiler

# Production
npm run build        # Build for production
npm start            # Start production server
```

## 🗺️ Routes

### User Routes
- `/` - Homepage
- `/quizzes` - Browse available quizzes
- `/quizzes/:id` - Take a quiz
- `/results/:id` - View quiz results
- `/progress` - Track progress over time

### Admin Routes
- `/admin/quizzes` - Manage all quizzes
- `/admin/quizzes/new` - Create new quiz
- `/admin/quizzes/:id/edit` - Edit existing quiz

## 🔑 Key Features

### ✅ Server-Side Rendering (SSR)
- Fast initial page load
- SEO-friendly
- No loading states needed

### ✅ Type Safety
- End-to-end TypeScript
- Type-safe loaders and actions
- MongoDB document types

### ✅ Progressive Enhancement
- Forms work without JavaScript
- Graceful degradation
- Accessible by default

### ✅ Clean Architecture
- Route-based structure
- Server/client code separation
- Reusable components

## 📚 Educational Comments

Every route file includes extensive comments explaining:
- **Execution flow** - What runs where (server vs client)
- **Learning points** - Why this pattern is used
- **Best practices** - How to scale the pattern

Example:
```typescript
/**
 * EXECUTION FLOW:
 * 1. LOADER runs on SERVER (fetches data)
 * 2. COMPONENT renders on server (SSR)
 * 3. COMPONENT hydrates on client (interactive)
 * 
 * LEARNING POINTS:
 * - No useEffect for data fetching
 * - No loading states needed
 * - Data is ready immediately
 */
```

## 🔐 Environment Variables

Create a `.env` file:

```bash
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/wellness-tracker

# Environment
NODE_ENV=development
```

## 🗄️ MongoDB Setup

### Local Development

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Cloud (MongoDB Atlas)

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `MONGODB_URI` in `.env`

## 🎯 Next Steps

### 1. Implement Full Quiz Builder
- Add dynamic question management
- Support multiple question types
- Configure score mappings

### 2. Add Authentication
- Integrate Auth.js or Clerk
- Protect admin routes
- Track results by user

### 3. Enhance Progress Tracking
- Add charts and visualizations
- Compare scores across quizzes
- Show trends over time

### 4. Deploy to Production
- Vercel (recommended)
- Fly.io
- Railway

See our [**Deployment Guide**](./docs/DEPLOYMENT.md) for detailed instructions.

## 📖 Documentation

- [React Router Docs](https://reactrouter.com)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

This is a learning project. Feel free to:
- Add new features
- Improve documentation
- Share your learnings

## 📄 License

MIT

---

**Built with ❤️ to help you master React Router Framework**
Hellu
