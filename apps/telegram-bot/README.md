# Lumo Telegram Accessibility Bot 📱

> **Low-Bandwidth, Zero-Barrier Accessibility Gateway for Learning & Career Opportunities**

The Lumo Telegram Bot extends Lumo's educational accessibility infrastructure to mobile chat. In developing regions such as Ethiopia and East Africa, mobile data is costly and unstable, but telecom operators (like Ethio Telecom) provide affordable or subsidized Telegram-only social packages. Furthermore, Telegram has first-class native accessibility support on Android (TalkBack) and iOS (VoiceOver).

---

## 🚀 Key Accessibility Features

1. **Low-Bandwidth Transcripts (`/caption <lesson_id>`)**:
   - Strips heavy video streams and delivers timestamped text transcripts directly in chat.
   - Consumes **< 10 KB** of data compared to 50–100 MB of video streaming (a 99.9% data reduction).
2. **AI Educator in Chat (`/ask <question>`)**:
   - Queries the local Ollama/FastAPI RAG service.
   - Provides plain-language explanations with exact timestamps citing the source transcript.
3. **Instant Offline Packages (`/offline <lesson_id>`)**:
   - Generates and delivers self-contained HTML5 offline zip packages (< 10 MB).
   - Learners download once and study anytime without network access.
4. **Accessible Career Gateway (`/job <job_id>`)**:
   - Surfaces job opportunities with plain-language duty summaries and explicit disability accommodations.
5. **Amharic & English Localization**:
   - Supports Ethiopic Fidel typography and multilingual command prompts.

---

## 🛠 Commands Reference

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/start` | None | Welcome banner, localization notice, and quick navigation menu. |
| `/help` | None | Accessibility navigation guide for TalkBack and VoiceOver users. |
| `/lesson` | `<lesson_id>` | Summarizes lesson metadata, duration, and accessibility features (ESL, AD). |
| `/caption` | `<lesson_id>` | Clean, screen-reader-optimized transcript broken into timed reading blocks. |
| `/ask` | `<question>` | Asks the source-grounded AI tutor questions directly from chat. |
| `/offline` | `<lesson_id>` | Generates and sends a downloadable offline package directly via Telegram document. |
| `/job` | `<job_id>` | Retrieves accessible job postings with accommodations information. |

---

## ⚙️ Configuration & Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | `mock-token-for-dev` | Telegram Bot token obtained from `@BotFather`. |
| `LUMO_API_BASE_URL` | `http://localhost:8000/api/v1` | URL of the Lumo FastAPI backend service. |
| `LUMO_API_KEY` | `lumo_dev_key_2026` | API authentication key for Lumo backend. |
| `LUMO_BOT_DEFAULT_LANG` | `en` | Default language for bot announcements (`en` or `am`). |

---

## 🧪 Testing & Execution

### Run Bot Tests
```bash
python -m pytest apps/telegram-bot/tests
```

### Run Live Bot (requires valid token from @BotFather)
```bash
export TELEGRAM_BOT_TOKEN="your-bot-token"
export LUMO_API_BASE_URL="http://localhost:8000/api/v1"
python -m apps.telegram-bot.bot.main
```
