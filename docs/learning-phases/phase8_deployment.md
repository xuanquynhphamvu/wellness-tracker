# Phase 8: Deployment & Monitoring

**Completed:** January 7, 2026  
**Complexity:** Medium

---

## 1. Deployment Overview

The content in this directory prepares the Wellness Tracker for production deployment using Docker or any Node.js hosting platform (Vercel, Railway, Render, etc.).

### Key Features Added
- **Production Build:** Optimized `npm run build` script.
- **Docker Support:** Multi-stage `Dockerfile` (based on `node:20-alpine`) for lightweight, consistent containers.
- **Health Check:** `/health` endpoint for uptime monitoring.
- **Environment config:** Strict production variables.

---

## 2. Environment Variables

For production, ensure these variables are set in your host or `.env` file (if using Docker Compose).

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | Production DB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/production?retryWrites=true&w=majority` |
| `SESSION_SECRET` | Secret for signing session cookies | `long-random-string-at-least-32-chars` |
| `PORT` | Port to listen on (internal) | `3000` |

> **Security Note:** Never commit `SESSION_SECRET` or `MONGODB_URI` to version control.

---

## 3. How to Build & Run

### A. Using Docker (Recommended)

1.  **Build the image:**
    ```bash
    docker build -t wellness-tracker .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 3000:3000 \
      -e MONGODB_URI="your_mongo_uri" \
      -e SESSION_SECRET="your_secret" \
      wellness-tracker
    ```

### B. using Node.js directly

1.  **Install dependencies and build:**
    ```bash
    npm ci
    npm run build
    ```

2.  **Start the server:**
    ```bash
    export NODE_ENV=production
    export MONGODB_URI="..."
    export SESSION_SECRET="..."
    npm run start
    ```

---

## 4. Monitoring

### Health Check
The application exposes a health check endpoint at `/health`.

- **URL:** `https://your-domain.com/health`
- **Response:** `200 OK`
- **Body:** `{ "status": "ok", "timestamp": "...", "uptime": 123.45 }`

Use this endpoint with uptime monitors (e.g., UptimeRobot, Pingdom, AWS Route53 Health Checks).

### Logs
Application logs are output to `stdout`/`stderr`.
- **Docker:** `docker logs <container_id>`
- **Host:** Check your process manager logs (PM2, systemd).

---

## 5. Verification Checklist

Before "going live":
1.  [ ] **Database:** Ensure MongoDB Atlas IP whitelist includes your production server IP.
2.  [ ] **Secrets:** distinct `SESSION_SECRET` from development.
3.  [ ] **HTTPS:** Ensure your host provides SSL/TLS termination (Vercel/Rail/load balancers do this automatically).
4.  [ ] **Backup:** Backup your production database before launch.
