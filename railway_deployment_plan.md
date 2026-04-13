# Railway Deployment Plan: Railway_Exam

This document outlines the steps to deploy the entire **Railway_Exam** stack (Frontend, Backend, and Database) on [Railway.app](https://railway.app/).

## 1. Project Structure Overview
Railway handles monorepos gracefully. We will create two separate services within a single Railway project, both pointing to this GitHub repository but with different root directories.

-   **Backend**: FastAPI (`/backend`)
-   **Frontend**: React/Vite (`/frontend`)
-   **Database**: Managed PostgreSQL (Railway Plugin)

---

## 2. Step-by-Step Deployment

### Phase A: Setup Railway Project
1.  Go to [Railway.app](https://railway.app/) and create a new project.
2.  Select **"Provision PostgreSQL"** to add a managed database immediately.

### Phase B: Deploy Backend (FastAPI)
1.  Click **"New"** -> **"GitHub Repo"** and select your `Railway_Exam` repository.
2.  Once created, go to the service **Settings**:
    -   **Service Name**: `backend-api`
    -   **Root Directory**: `/backend`
3.  Go to **Variables** and add:
    -   `DATABASE_URL`: Click "Reference Variable" and select the Postgres service's connection string (e.g., `${{Postgres.DATABASE_URL}}`). 
        *(The backend is now configured to automatically handle both `DATABASE_URL` and `postgres://` prefixes).*
    -   `PORT`: `8000`
    -   `SECRET_KEY`: (Generate a secure string)
    -   `ALGORITHM`: `HS256`
    -   `RAZORPAY_KEY_ID`: (Your Key)
    -   `RAZORPAY_KEY_SECRET`: (Your Key)
    -   `GROQ_API_KEY`: (Your Key)
    -   `BACKEND_CORS_ORIGINS`: `["https://your-frontend-url.up.railway.app"]`
4.  **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`

### Phase C: Deploy Frontend (React/Vite)
1.  Click **"New"** -> **"GitHub Repo"** and select the same `Railway_Exam` repository again.
2.  Go to the service **Settings**:
    -   **Service Name**: `frontend-web`
    -   **Root Directory**: `/frontend`
3.  Go to **Variables** and add:
    -   `VITE_API_URL`: The public URL of your `backend-api` service (e.g., `https://backend-api-production.up.railway.app/api/v1`).
        *(Note the `/api/v1` suffix required by the frontend config).*
4.  Railway will detect Vite and use:
    -   **Build Command**: `npm run build`
    -   **Start Command**: `npm run preview`
    -   *Note: For Vite SPAs, ensure the build output `dist` is served correctly.*

---

## 3. Configuration Changes Already Implemented

-   **Backend**: `backend/core/config.py` has been updated to support the `DATABASE_URL` environment variable directly and correctly format it for SQLAlchemy (`postgresql://`).
-   **Database Engine**: `backend/core/db.py` now uses the improved connection logic.
-   **Frontend**: `frontend/src/services/api.js` is already set up to use `VITE_API_URL`.

---

## 4. Verification
1.  **Database**: Check Railway's "Data" tab to ensure connectivity.
2.  **API Health**: Visit `https://your-backend-api.up.railway.app/docs`.
3.  **Frontend**: Visit the frontend URL and test the login flow.

---

## 5. Potential Costs
-   Railway uses usage-based pricing. A small project typically stays within the $5/month credits if active, or free during trial periods.

> [!TIP]
> **Internal Networking**: Since the backend and database are on Railway, they can communicate via the private network (using the `DATABASE_URL` reference). For the Frontend to Backend communication, you MUST use the **Public URL** of the backend because it's called from the user's browser, not Railway's servers.
