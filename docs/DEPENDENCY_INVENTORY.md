# Open-Source Dependency and Licence Inventory

This document provides a comprehensive inventory of all third-party and open-source libraries integrated into the **Lumo (ሉሞ)** accessibility platform for Digital Bridge Hackathon 2026 (Track 2).

## Monorepo Dependency Matrix

| Package / Library | Version | Licence | Upstream Repository | Purpose in Lumo |
| :--- | :--- | :--- | :--- | :--- |
| **@axe-core/playwright** | `^4.14.0` | MPL-2.0 | [dequelabs/axe-core](https://github.com/dequelabs/axe-core) | Automated WCAG 2.2 AA accessibility test auditing across Shadow DOM |
| **pa11y** | `^10.0.0` | LGPL-3.0 | [pa11y/pa11y](https://github.com/pa11y/pa11y) | Command-line and scriptable automated accessibility auditing against WCAG 2.2 AA |
| **video.js** | `^10.4.0` | Apache-2.0 | [videojs/video.js](https://github.com/videojs/video.js) | Underlying open-source media player engine and adapter architecture in `@lumo/media-engine` |
| **@playwright/test** | `^1.49.0` | Apache-2.0 | [microsoft/playwright](https://github.com/microsoft/playwright) | End-to-end browser automation & keyboard navigation test suite |
| **vitest** | `^2.1.8` | MIT | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | Fast unit test runner for parsers, state machines, and discovery |
| **rollup** | `^4.28.1` | MIT | [rollup/rollup](https://github.com/rollup/rollup) | Zero-dependency bundler producing single-file embed SDK distribution |
| **typescript** | `^5.7.2` | Apache-2.0 | [microsoft/TypeScript](https://github.com/microsoft/TypeScript) | Static type safety and declaration generation across monorepo |
| **workbox-sw** | `7.0.0` | MIT | [GoogleChrome/workbox](https://github.com/GoogleChrome/workbox) | Service Worker routing, CacheFirst media caching, and asset resilience |
| **fastapi** | `>=0.115.0` | MIT | [tiangolo/fastapi](https://github.com/tiangolo/fastapi) | High-performance Python backend REST API |
| **uvicorn** | `>=0.30.0` | BSD-3-Clause | [encode/uvicorn](https://github.com/encode/uvicorn) | ASGI web server implementation |
| **pydantic** | `>=2.8.0` | MIT | [pydantic/pydantic](https://github.com/pydantic/pydantic) | Data validation and schema settings |
| **httpx** | `>=0.27.0` | BSD-3-Clause | [encode/httpx](https://github.com/encode/httpx) | Async HTTP client for external integrations and test client |
| **python-telegram-bot**| `>=20.6` | LGPL-3.0 | [python-telegram-bot](https://github.com/python-telegram-bot/python-telegram-bot) | Telegram accessibility bot for low-bandwidth SMS/chat access |
| **pytest** | `>=9.2.0` | MIT | [pytest-dev/pytest](https://github.com/pytest-dev/pytest) | Test framework for API services and security fixtures |
| **pytest-asyncio** | `>=1.5.0` | Apache-2.0 | [pytest-dev/pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio) | Async test fixture support for FastAPI and Telegram bot |

## Media Engine & Architectural Selection

### Evaluation: Able Player vs. Video.js Architecture
* **Evaluation Criteria:** Shadow DOM encapsulation, custom element compatibility, keyboard accessibility, bundle footprint, maintenance overhead.
* **Selection:** HTML5 Media Engine Adapter implementing standard `LumoMediaEngine` abstraction (modeled on Video.js decoupled architecture).
* **Rationale:** Direct integration into standard Web Components without jQuery dependency overhead, enabling zero-runtime-dependency embed distribution (`lumo.min.js`) while maintaining strict WCAG 2.2 AA keyboard and ARIA compliance.

## Licence Compliance Statement
All packages utilized in production builds (`@lumo/embed-sdk`, `@lumo/core`, `@lumo/media-engine`, `@lumo/resource-discovery`, `@lumo/offline`, `@lumo/document-processor`) use permissive licences (MIT or Apache-2.0). No copyleft or GPL contamination exists in the distributed JavaScript bundles.
