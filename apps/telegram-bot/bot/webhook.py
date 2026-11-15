"""Vercel Serverless Webhook Entrypoint for Lumo Telegram Bot."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from telegram import Update
from .main import build_application
from .config import bot_config

bot_app = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global bot_app
    bot_app = build_application()
    if bot_config.bot_token != "mock-token-for-dev":
        await bot_app.initialize()
    yield
    if bot_app and bot_config.bot_token != "mock-token-for-dev":
        await bot_app.shutdown()


app = FastAPI(
    title="Lumo Telegram Bot Webhook",
    lifespan=lifespan
)


@app.post("/webhook")
@app.post("/bot/webhook")
async def telegram_webhook(request: Request):
    """Processes incoming Telegram updates via HTTP webhook."""
    global bot_app
    if not bot_app:
        bot_app = build_application()
        if bot_config.bot_token != "mock-token-for-dev":
            await bot_app.initialize()

    data = await request.json()
    update = Update.de_json(data, bot_app.bot)
    await bot_app.process_update(update)
    return Response(content="OK", status_code=200)


@app.get("/")
@app.get("/bot")
@app.get("/bot/health")
async def health():
    return {
        "service": "Lumo Telegram Bot Webhook",
        "configured": bot_config.bot_token != "mock-token-for-dev"
    }
