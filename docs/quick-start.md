# Lumo Quick Start Guide (5 Minutes)

Get the complete Lumo accessibility infrastructure running on your local machine in five simple steps.

---

## Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **pnpm**: `corepack enable && corepack prepare pnpm@latest --activate`
- **Python**: 3.10+
- **Google Chrome** or Chromium

---

## Step 1: Clone and Install
```bash
git clone https://github.com/zelalem-gezahegn/lumo.git
cd lumo
pnpm install
```

## Step 2: Build All Frontend Packages
Compile the core accessibility engines, standalone embed SDK, offline service worker, and document processor:
```bash
pnpm build
```
This produces `packages/embed-sdk/dist/lumo.min.js` (41 KB standalone minified script).

## Step 3: Run the Accessibility & Unit Test Suites
Verify all 35+ automated tests pass with zero WCAG 2.2 AA violations:
```bash
# 1. Run Vitest unit tests for core engines
pnpm test

# 2. Run Playwright + axe-core accessibility gate
pnpm test:a11y

# 3. Run FastAPI backend & Telegram bot tests
python -m pytest services/api/tests apps/telegram-bot/tests
```

## Step 4: Start the Local Development Server
Start the FastAPI backend and preview the test harness:
```bash
# Terminal 1: Start FastAPI backend
cd services/api
uvicorn app.main:app --reload --port 8000

# Terminal 2: Serve the sample integrations
python -m http.server 8080
```

## Step 5: Explore the Accessible Demos in Your Browser
Open your browser to:
- **Interactive Player Harness**: [http://localhost:8080/samples/test-harness.html](http://localhost:8080/samples/test-harness.html)
- **ALX Savanna Platform Demo**: [http://localhost:8080/samples/savanna-demo.html](http://localhost:8080/samples/savanna-demo.html)
- **Career Gateway Job Card**: [http://localhost:8080/samples/career-gateway.html](http://localhost:8080/samples/career-gateway.html)
- **Interactive OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

*That's it! You now have a production-ready, WCAG 2.2 AA compliant educational media player and accessibility pipeline running locally.*
