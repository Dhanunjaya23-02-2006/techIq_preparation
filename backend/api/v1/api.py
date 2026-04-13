from fastapi import APIRouter
from .endpoints import accounts, questions, tests, subscriptions, pdf, analytics, leaderboard, content, notifications, chat, webhooks


api_router = APIRouter()

api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])
api_router.include_router(tests.router, prefix="/tests", tags=["tests"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(pdf.router, prefix="/pdf", tags=["pdf"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
