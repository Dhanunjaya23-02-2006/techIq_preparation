# Deployment Plan: Railway_Exam (Free Tier)

This plan outlines the steps to deploy the Railway_Exam application for free using modern cloud platforms.

## Proposed Strategy

1.  **Database**: Use **Neon.tech** (Serverless Postgres) for a free, scalable database.
2.  **Backend**: Use **Render.com** (Free tier) to host the FastAPI application.
3.  **Frontend**: Use **Vercel** or **Netlify** (Free tier) to host the React application.

---

## Proposed Changes

### [Backend] (FastAPI)

#### [MODIFY] [config.py](file:///c:/Users/ambha/Desktop/Railway_Exam/backend/core/config.py)
- Ensure all sensitive configurations (Database URL, Secret Keys, Razorpay Keys) are loaded from environment variables.
- Add `BACKEND_CORS_ORIGINS` support for the production frontend URL.

#### [NEW] [render.yaml](file:///c:/Users/ambha/Desktop/Railway_Exam/backend/render.yaml)
- Define the Render Blueprint for easy deployment, including the Python version and start command.

---

### [Frontend] (React/Vite)

#### [MODIFY] [api.js](file:///c:/Users/ambha/Desktop/Railway_Exam/frontend/src/services/api.js)
- Update `baseURL` to use an environment variable (e.g., `import.meta.env.VITE_API_BASE_URL`) so it can point to the Render backend in production.

#### [NEW] [vercel.json](file:///c:/Users/ambha/Desktop/Railway_Exam/frontend/vercel.json)
- Add configuration for client-side routing (SPAs) to ensure refreshes work correctly on Vercel.

---

## Verification Plan

- Run `npm run build` in the frontend to ensure the production build succeeds.
- Run a local test of the backend with a remote Postgres connection string (if possible).

### Manual Verification
1.  **Database Migration**: Run Alembic migrations (if used) or manual table creation on the Neon database.
2.  **Backend Connectivity**: Verify the Backend API is reachable via its Render URL.
3.  **Frontend Integration**: Verify the Frontend correctly communicates with the Backend in the production environment.
4.  **End-to-End**: Perform a full user flow (Register -> Login -> Dashboard) on the live site.

---

---

## Railway.app Deployment (Recommended)

Based on the project name and your request, **Railway.app** is the recommended platform for this stack. 

### Key Advantages:
- **Managed Postgres**: Provisioned with one click.
- **Monorepo Support**: Easy to deploy `/backend` and `/frontend` as separate services in one project.
- **Unified Billing**: Pay for what you use across all services.

> [!NOTE]
> I have created a detailed [Railway Deployment Plan](file:///C:/Users/ambha/.gemini/antigravity/brain/4e8eac20-f4c4-4863-beed-74aeefc66307/railway_deployment_plan.md) which you can follow for step-by-step instructions.

### Prerequisites:
1. Create an account on [Railway.app](https://railway.app/).
2. Link your GitHub repository.
3. Ensure you have your Razorpay and Groq API keys ready for environment variables.
