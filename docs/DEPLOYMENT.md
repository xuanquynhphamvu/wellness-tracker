# Deployment Guide

This guide explains how to deploy the Wellness Tracker application to production. We recommend **Vercel** for the easiest experience with React Router v7 (Remix architecture), but the application can be deployed to any platform that supports Node.js.

## Prerequisites

- A GitHub repository with your project code.
- A MongoDB Atlas cluster (free tier is fine).
- A Vercel account (free tier is fine).

## Environment Variables

You must configure the following environment variables in your production environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | Connection string for your MongoDB database. | `mongodb+srv://user:pass@cluster.mongodb.net/wellness-tracker` |
| `SESSION_SECRET` | Secret key for signing session cookies. | `super-secret-random-string-at-least-32-chars` |
| `NODE_ENV` | Set to `production` for optimized performance. | `production` |

## Deploying to Vercel (Recommended)

1.  **Push to GitHub:** Ensure your latest code is pushed to your GitHub repository.
2.  **Import Project:** Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**. Import your Wellness Tracker repository.
3.  **Configure Project:**
    -   **Framework Preset:** Vercel should auto-detect "Remix" or "Vite". If not, select "Remix".
    -   **Root Directory:** `./` (default)
    -   **Build Command:** `npm run build` (default)
    -   **Output Directory:** `build/client` (default)
    -   **Install Command:** `npm install` (default)
4.  **Environment Variables:** Expand the "Environment Variables" section and add:
    -   `MONGODB_URI`
    -   `SESSION_SECRET`
    -   `NODE_ENV` = `production`
5.  **Deploy:** Click **"Deploy"**. Vercel will build your application and assign a domain (e.g., `wellness-tracker.vercel.app`).

### Post-Deployment Checks

-   Visit your new URL.
-   Try to register a new user (verifies DB connection).
-   Log in (verifies session signing).
-   Take a quiz (verifies DB writes).

## Deploying to Fly.io (Alternative)

If you prefer a persistent Node.js server (required if you use WebSockets or long-running background tasks, though this app currently does not):

1.  **Install Fly CLI:** `brew install flyctl` (macOS) or curl script.
2.  **Login:** `fly auth login`.
3.  **Launch:** Run `fly launch` in the project root.
    -   It will generate a `fly.toml` file.
    -   It will ask to set up a Postgres DB (say **No**, we use MongoDB).
    -   It will ask to deploy now (say **No** to configure secrets first).
4.  **Set Secrets:**
    ```bash
    fly secrets set MONGODB_URI="your-mongodb-uri" SESSION_SECRET="your-secret"
    ```
5.  **Deploy:** `fly deploy`.

## Building Locally

To verify the production build locally:

```bash
npm run build
npm start
```

This will run the server on `http://localhost:3000` using the production build artifacts.
