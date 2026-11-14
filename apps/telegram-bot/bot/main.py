"""Lumo Telegram Bot Entrypoint."""

import logging
from telegram.ext import ApplicationBuilder, CommandHandler
from .config import bot_config
from .handlers import (
    start_handler,
    help_handler,
    lesson_handler,
    caption_handler,
    ask_handler,
    offline_handler,
    job_handler
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("lumo-bot")


def build_application():
    """Constructs the Telegram Bot Application with all command handlers."""
    app = ApplicationBuilder().token(bot_config.bot_token).build()

    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("help", help_handler))
    app.add_handler(CommandHandler("lesson", lesson_handler))
    app.add_handler(CommandHandler("caption", caption_handler))
    app.add_handler(CommandHandler("ask", ask_handler))
    app.add_handler(CommandHandler("offline", offline_handler))
    app.add_handler(CommandHandler("job", job_handler))

    return app


def main():
    """Runs the bot via polling."""
    logger.info("Initializing Lumo Telegram Accessibility Bot...")
    if bot_config.bot_token == "mock-token-for-dev":
        logger.warning(
            "TELEGRAM_BOT_TOKEN is set to default mock token. Set TELEGRAM_BOT_TOKEN environment variable to run live on Telegram."
        )
        return

    application = build_application()
    logger.info("Starting polling loop...")
    application.run_polling()


if __name__ == "__main__":
    main()
