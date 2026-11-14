# Lumo Privacy & Data Protection Policy

> **Effective Date:** November 2026  
> **Commitment:** Zero Playback Surveillance, Privacy-First Architecture

---

## 1. Core Privacy Philosophy

At Lumo, we believe that **access to education is a fundamental human right**, and learning should never come at the price of user surveillance. 

Students with disabilities are especially vulnerable to digital profiling, discrimination, and privacy violations. Disclosing that a learner utilizes a screen reader, captions, audio descriptions, or sign language reveals sensitive medical and accessibility information.

**Lumo enforces an absolute zero-telemetry policy for all learner interactions.**

---

## 2. What We DO NOT Collect

During media playback and interaction with `<lumo-player>`, Lumo:
- **DOES NOT** track or log which accessibility features you activate (e.g., screen reader announcements, caption language, sign language window, audio description).
- **DOES NOT** employ tracking cookies, advertising pixels, analytics beacons, or fingerprinting scripts.
- **DOES NOT** report playback timestamps, pauses, seeks, or completion rates to any external advertising or data-broker network.
- **DOES NOT** send audio, video, or camera streams from your device.

---

## 3. Client-Side Local Storage

All user preferences (such as preferred caption language, high-contrast theme, caption font size, and sign language window position) are saved **exclusively on your local device** using `localStorage` and `IndexedDB`.
- Preferences never leave your browser.
- You can clear your preferences at any time by clearing your browser's site data.

---

## 4. Local Open-Source AI & Data Isolation

Lumo's AI Educator and transcription services:
- Default to **local, on-premise open-source models** (e.g., local Ollama Qwen2.5/Whisper).
- Questions submitted via the `/ask` endpoint or Telegram bot are processed ephemerally solely to formulate the grounded educational answer.
- Queries are **never** used to train commercial proprietary foundation models.
- Transcripts and lecture documents are processed in memory and deleted after processing.

---

## 5. Offline Media & Data Security

When downloading an offline learning package (< 10 MB):
- The bundle is generated deterministically without embedding tracking IDs or personalized watermarks.
- Once downloaded to your computer or mobile device, the offline player runs in an isolated local sandbox with zero network requests.

---

## 6. Children's Privacy & Educational Data Rights

Lumo complies with:
- **FERPA** (Family Educational Rights and Privacy Act).
- **COPPA** (Children's Online Privacy Protection Act).
- **GDPR** Article 9 (Special Category Personal Data protection).

---

## 7. Contact Us

If you have questions regarding data privacy or want to audit Lumo's privacy practices:
- **Privacy Officer**: privacy@lumo.education
- **Source Code Audit**: All code is open source and verifiable at [https://github.com/zelalem-gezahegn/lumo](https://github.com/zelalem-gezahegn/lumo).
