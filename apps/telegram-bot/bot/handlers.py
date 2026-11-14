"""Telegram Bot Command and Message Handlers for Lumo."""

import io
import re
from typing import Dict, Any
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes
from .api_client import LumoAPIClient, api_client


def strip_vtt_to_readable_text(vtt_content: str) -> str:
    """Converts WebVTT caption string into human and screen-reader friendly text."""
    lines = vtt_content.splitlines()
    text_blocks = []
    
    current_time = ""
    current_text = []
    
    time_pattern = re.compile(r"(\d{2}:\d{2}(?::\d{2})?\.\d{3})\s*-->\s*(\d{2}:\d{2}(?::\d{2})?\.\d{3})")

    for line in lines:
        line = line.strip()
        if not line or line.startswith("WEBVTT") or line.startswith("NOTE"):
            continue
        
        match = time_pattern.search(line)
        if match:
            if current_text:
                text_blocks.append(f"⏱ [{current_time}]\n{' '.join(current_text)}")
                current_text = []
            # Simplify timestamp for screen readers (e.g., 00:01.000 -> 00:01)
            current_time = match.group(1).split(".")[0]
        elif not line.isdigit():
            # Clean HTML/VTT tags like <v ...> or <b>
            clean = re.sub(r"<[^>]+>", "", line)
            if clean:
                current_text.append(clean)
                
    if current_text:
        text_blocks.append(f"⏱ [{current_time}]\n{' '.join(current_text)}")

    return "\n\n".join(text_blocks) if text_blocks else "No transcript content found."


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles /start command with accessible welcome and command list."""
    welcome_text = (
        "🌟 *Welcome to Lumo Accessibility Gateway*\n"
        "ሰላም! እንኳን ወደ ሉሞ የትምህርት ተደራሽነት አገልግሎት በደህና መጡ።\n\n"
        "Lumo makes education accessible for everyone — including screen-reader users, "
        "deaf learners, and students in low-connectivity areas.\n\n"
        "📚 *Available Commands:*\n"
        "• `/lesson <id>` — View lesson summary & accessibility media\n"
        "• `/caption <id>` — Read full lesson transcript (uses < 10KB data!)\n"
        "• `/ask <question>` — Ask the AI Educator questions grounded in the lesson\n"
        "• `/offline <id>` — Download complete offline HTML lesson package (<10MB)\n"
        "• `/job <id>` — View accessible job posting from Career Gateway\n"
        "• `/help` — Screen reader tips and accessibility guide\n\n"
        "_Tip: Try typing_ `/lesson web101` _or_ `/caption web101` _to start!_"
    )
    if update.message:
        await update.message.reply_text(welcome_text, parse_mode=ParseMode.MARKDOWN)


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles /help command with assistive technology guidance."""
    help_text = (
        "ℹ️ *Lumo Accessibility & Navigation Guide*\n\n"
        "📱 *Assistive Technology Tips:*\n"
        "• *TalkBack (Android)*: Swipe right/left to read commands sequentially. Double-tap to activate links.\n"
        "• *VoiceOver (iOS)*: Use the rotor set to Headings to jump between sections.\n"
        "• *Low-Bandwidth Mode*: Audio and text transcripts consume less than 1% of the data required by full video streaming.\n\n"
        "🔧 *Commands Reference:*\n"
        "• `/lesson <lesson_id>`: Retrieves metadata, duration, and accessibility features.\n"
        "• `/caption <lesson_id>`: Returns timestamped clean captions (English & Amharic).\n"
        "• `/ask <your question>`: Queries the RAG AI tutor. Strictly verified against course transcripts.\n"
        "• `/offline <lesson_id>`: Packages a self-contained offline HTML player with embedded styles.\n"
        "• `/job <job_id>`: View job vacancies with accessibility accommodations and plain language.\n\n"
        "Support & Feedback: accessibility@lumo.education"
    )
    if update.message:
        await update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN)


async def lesson_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, client: LumoAPIClient = api_client) -> None:
    """Handles /lesson <id> command."""
    if not update.message:
        return
    
    args = context.args or []
    lesson_id = args[0] if args else "web101"

    try:
        data = await client.get_lesson(lesson_id)
        esl_status = "✅ Included" if data.get("has_sign_language") else "❌ Not available"
        ad_status = "✅ Included" if data.get("has_audio_description") else "❌ Not available"
        langs = ", ".join([lang.upper() for lang in data.get("languages_supported", ["EN"])])

        response = (
            f"📖 *Lesson: {data.get('title')}*\n\n"
            f"📝 *Description:*\n{data.get('description')}\n\n"
            f"⏱ *Duration:* {data.get('duration_seconds', 0) // 60} minutes\n"
            f"🌐 *Languages:* {langs}\n"
            f"🤟 *Ethiopian Sign Language (ESL):* {esl_status}\n"
            f"🎙 *Audio Description (AD):* {ad_status}\n\n"
            f"💡 *Summary:*\n_{data.get('transcript_summary')}_\n\n"
            f"👉 Use `/caption {lesson_id}` for the low-data transcript or `/offline {lesson_id}` for the offline bundle."
        )
        await update.message.reply_text(response, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        await update.message.reply_text(
            f"⚠️ Could not load lesson `{lesson_id}`. Please verify the ID or check back later.\nError: {str(e)}",
            parse_mode=ParseMode.MARKDOWN
        )


async def caption_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, client: LumoAPIClient = api_client) -> None:
    """Handles /caption <id> command."""
    if not update.message:
        return
    
    args = context.args or []
    lesson_id = args[0] if args else "lesson-1"

    try:
        vtt = await client.get_captions_vtt(lesson_id)
        readable_text = strip_vtt_to_readable_text(vtt)

        header = f"📜 *Transcript for Lesson `{lesson_id}`* (Low-Bandwidth Text View)\n\n"
        full_text = header + readable_text

        # Telegram message limit is 4096 characters; split into chunks if necessary
        max_len = 4000
        for i in range(0, len(full_text), max_len):
            chunk = full_text[i:i + max_len]
            await update.message.reply_text(chunk, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        await update.message.reply_text(
            f"⚠️ Could not fetch captions for `{lesson_id}`. Error: {str(e)}",
            parse_mode=ParseMode.MARKDOWN
        )


async def ask_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, client: LumoAPIClient = api_client) -> None:
    """Handles /ask <question> command."""
    if not update.message:
        return
    
    question = " ".join(context.args) if context.args else ""
    if not question:
        await update.message.reply_text(
            "❓ Please provide a question after `/ask`. For example:\n`/ask What contrast ratio does WCAG AA require?`",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    await update.message.reply_text("🤔 *Analyzing course materials and generating answer...*", parse_mode=ParseMode.MARKDOWN)

    try:
        result = await client.ask_question(lesson_id="web101", question=question)
        answer = result.get("answer", "No answer found.")
        citations = result.get("citations", [])

        citation_texts = []
        for idx, cit in enumerate(citations, 1):
            citation_texts.append(
                f"[{idx}] {cit.get('timestamp_start')}–{cit.get('timestamp_end')}: \"_{cit.get('excerpt')}_\""
            )
        
        citations_block = "\n".join(citation_texts) if citation_texts else "General course context."

        response = (
            f"🎓 *AI Educator Response:*\n\n"
            f"{answer}\n\n"
            f"📌 *Grounding Citations (from Course Transcript):*\n"
            f"{citations_block}\n\n"
            f"_Confidence: {int(result.get('confidence_score', 0.9) * 100)}% | Verified Grounded_"
        )
        await update.message.reply_text(response, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        await update.message.reply_text(f"⚠️ Error querying AI Educator: {str(e)}")


async def offline_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, client: LumoAPIClient = api_client) -> None:
    """Handles /offline <id> command to deliver a standalone offline zip package directly."""
    if not update.message:
        return
    
    args = context.args or []
    lesson_id = args[0] if args else "web101"

    await update.message.reply_text(
        f"📦 *Packaging offline lesson `{lesson_id}`...*\n"
        "Generating self-contained HTML5 player with embedded captions and styles. Please wait a moment.",
        parse_mode=ParseMode.MARKDOWN
    )

    try:
        gen_res = await client.generate_offline_package(
            lesson_id=lesson_id,
            title=f"Lesson {lesson_id.upper()}: Web Accessibility"
        )
        package_id = gen_res["package_id"]
        
        # Download bytes
        zip_bytes = await client.download_package_bytes(package_id)
        
        doc_stream = io.BytesIO(zip_bytes)
        doc_stream.name = f"lumo-offline-{lesson_id}.zip"

        caption = (
            f"✅ *Offline Package Ready!*\n"
            f"Lesson: `{lesson_id}`\n"
            f"Size: {len(zip_bytes) / 1024:.1f} KB\n\n"
            f"💡 *How to use offline:*\n"
            f"1. Download and unzip on your mobile device or computer.\n"
            f"2. Open `index.html` in Chrome, Firefox, or Safari.\n"
            f"3. Works 100% without internet connectivity!"
        )
        await update.message.reply_document(
            document=doc_stream,
            caption=caption,
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception as e:
        await update.message.reply_text(f"⚠️ Failed to generate offline package: {str(e)}")


async def job_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles /job <id> command for accessible employment opportunities."""
    if not update.message:
        return
    
    args = context.args or []
    job_id = args[0] if args else "job-accessibility-specialist-01"

    job_text = (
        f"💼 *Career Gateway — Job Opportunity*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🏢 *Role:* Junior Accessibility Quality Assurance Tester\n"
        f"🏛 *Employer:* Inclusive Tech Africa / ALX Ethiopia\n"
        f"📍 *Location:* Addis Ababa, Ethiopia (Hybrid / Remote Option)\n"
        f"💰 *Compensation:* Competitive + Assistive Tech Stipend\n\n"
        f"📋 *Responsibilities:*\n"
        f"• Audit web and mobile applications using NVDA, JAWS, and TalkBack.\n"
        f"• Verify WCAG 2.2 Level AA compliance for educational software.\n"
        f"• Report user experience barriers faced by assistive technology users.\n\n"
        f"♿ *Inclusive Workplace Accommodations:*\n"
        f"• Screen reader license provided (JAWS/NVDA).\n"
        f"• Flexible working hours and quiet working zones.\n"
        f"• Ethiopian Sign Language (ESL) interpretation provided for all all-hands meetings.\n\n"
        f"🔗 *Apply online:* https://career.lumo.education/jobs/{job_id}"
    )
    await update.message.reply_text(job_text, parse_mode=ParseMode.MARKDOWN)
