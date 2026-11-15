"""Unit and integration tests for Lumo Telegram Bot."""

import os
import sys
import pytest
from unittest.mock import AsyncMock, MagicMock
from telegram import Update, Message
from telegram.ext import CallbackContext

# Ensure bot package is resolvable regardless of hyphens in folder name
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from bot.handlers import (
    strip_vtt_to_readable_text,
    start_handler,
    help_handler,
    lesson_handler,
    caption_handler,
    ask_handler,
    job_handler,
    waas_handler,
    verify_handler
)


def test_strip_vtt_to_readable_text():
    sample_vtt = """WEBVTT

00:00:00.000 --> 00:00:04.000
Welcome to Lumo Accessible Learning.

00:00:04.000 --> 00:00:09.000
Web accessibility ensures that everyone can learn.
"""
    result = strip_vtt_to_readable_text(sample_vtt)
    assert "⏱ [00:00:00]" in result
    assert "Welcome to Lumo Accessible Learning." in result
    assert "Web accessibility ensures that everyone can learn." in result
    assert "WEBVTT" not in result


@pytest.mark.asyncio
async def test_start_handler():
    mock_update = MagicMock(spec=Update)
    mock_message = AsyncMock(spec=Message)
    mock_update.message = mock_message

    mock_context = MagicMock(spec=CallbackContext)

    await start_handler(mock_update, mock_context)
    mock_message.reply_text.assert_called_once()
    sent_text = mock_message.reply_text.call_args[0][0]
    assert "Lumo Accessibility Gateway" in sent_text
    assert "ሰላም!" in sent_text


@pytest.mark.asyncio
async def test_help_handler():
    mock_update = MagicMock(spec=Update)
    mock_message = AsyncMock(spec=Message)
    mock_update.message = mock_message

    mock_context = MagicMock(spec=CallbackContext)

    await help_handler(mock_update, mock_context)
    mock_message.reply_text.assert_called_once()
    sent_text = mock_message.reply_text.call_args[0][0]
    assert "TalkBack" in sent_text
    assert "VoiceOver" in sent_text


@pytest.mark.asyncio
async def test_lesson_handler():
    mock_update = MagicMock(spec=Update)
    mock_message = AsyncMock(spec=Message)
    mock_update.message = mock_message

    mock_context = MagicMock(spec=CallbackContext)
    mock_context.args = ["web101"]

    mock_client = MagicMock()
    mock_client.get_lesson = AsyncMock(return_value={
        "title": "Accessible Web Architecture",
        "description": "Learn semantic HTML and WCAG 2.2.",
        "duration_seconds": 360,
        "languages_supported": ["en", "am"],
        "has_sign_language": True,
        "has_audio_description": True,
        "transcript_summary": "Semantic HTML and contrast guidelines."
    })

    await lesson_handler(mock_update, mock_context, client=mock_client)
    mock_message.reply_text.assert_called_once()
    sent_text = mock_message.reply_text.call_args[0][0]
    assert "Accessible Web Architecture" in sent_text
    assert "Ethiopian Sign Language" in sent_text
    assert "Audio Description" in sent_text


@pytest.mark.asyncio
async def test_caption_handler():
    mock_update = MagicMock(spec=Update)
    mock_message = AsyncMock(spec=Message)
    mock_update.message = mock_message

    mock_context = MagicMock(spec=CallbackContext)
    mock_context.args = ["lesson-1"]

    mock_client = MagicMock()
    mock_client.get_captions_vtt = AsyncMock(return_value="""WEBVTT

00:00:01.000 --> 00:00:05.000
This is a caption test.
""")

    await caption_handler(mock_update, mock_context, client=mock_client)
    mock_message.reply_text.assert_called_once()
    sent_text = mock_message.reply_text.call_args[0][0]
    assert "Transcript for Lesson `lesson-1`" in sent_text
    assert "This is a caption test." in sent_text


@pytest.mark.asyncio
async def test_ask_handler():
    mock_update = MagicMock(spec=Update)
    mock_message = AsyncMock(spec=Message)
    mock_update.message = mock_message

    mock_context = MagicMock(spec=CallbackContext)
    mock_context.args = ["What", "is", "WCAG?"]

    mock_client = MagicMock()
    mock_client.ask_question = AsyncMock(return_value={
        "answer": "WCAG stands for Web Content Accessibility Guidelines.",
        "citations": [{"timestamp_start": "00:01:00", "timestamp_end": "00:01:15", "excerpt": "WCAG guidelines"}],
        "confidence_score": 0.98
    })

    await ask_handler(mock_update, mock_context, client=mock_client)
    assert mock_message.reply_text.call_count == 2
    final_text = mock_message.reply_text.call_args[0][0]
    assert "AI Educator Response" in final_text
    assert "Web Content Accessibility Guidelines" in final_text


@pytest.mark.asyncio
async def test_job_handler():
    mock_update = MagicMock(spec=Update)
    mock_message = AsyncMock(spec=Message)
    mock_update.message = mock_message

    mock_context = MagicMock(spec=CallbackContext)
    mock_context.args = ["job-101"]

    await job_handler(mock_update, mock_context)
    mock_message.reply_text.assert_called_once()
    sent_text = mock_message.reply_text.call_args[0][0]
    assert "Career Gateway" in sent_text
    assert "Inclusive Workplace Accommodations" in sent_text


@pytest.mark.asyncio
async def test_waas_handler():
    mock_update = MagicMock(spec=Update)
    mock_message = AsyncMock(spec=Message)
    mock_update.message = mock_message

    mock_client = MagicMock()
    mock_client.list_waas_guarantors = AsyncMock(return_value={
        "institutions": [{"name": "ALX Ethiopia Education Partner", "scope": "Accredited education partner"}]
    })

    mock_context = MagicMock(spec=CallbackContext)
    mock_context.bot_data = {"api_client": mock_client}

    await waas_handler(mock_update, mock_context)
    mock_message.reply_text.assert_called_once()
    sent_text = mock_message.reply_text.call_args[0][0]
    assert "Digital WaaS" in sent_text
    assert "ALX Ethiopia Education Partner" in sent_text


@pytest.mark.asyncio
async def test_verify_handler():
    mock_update = MagicMock(spec=Update)
    mock_message = AsyncMock(spec=Message)
    mock_update.message = mock_message

    mock_client = MagicMock()
    mock_client.verify_waas_credential = AsyncMock(return_value={
        "isValid": True,
        "status": "VALID",
        "subject": {"name": "Fatima Ahmed"},
        "credential": {
            "issuer": "ALX Education Partner",
            "purpose": "Scholarship",
            "issuedAt": "2026-01-01T00:00:00Z",
            "expiresAt": "2027-01-01T00:00:00Z"
        },
        "signatureValid": True
    })

    mock_context = MagicMock(spec=CallbackContext)
    mock_context.args = ["WAAS-2026-ALX-001"]
    mock_context.bot_data = {"api_client": mock_client}

    await verify_handler(mock_update, mock_context)
    mock_message.reply_text.assert_called_once()
    sent_text = mock_message.reply_text.call_args[0][0]
    assert "WaaS Credential Verification" in sent_text
    assert "Fatima Ahmed" in sent_text
    assert "VALID" in sent_text
    assert "HMAC-SHA256" in sent_text
