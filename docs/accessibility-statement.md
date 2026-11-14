# Lumo Accessibility Statement

> **Date of Issue:** November 2026  
> **Applicable Standard:** W3C Web Content Accessibility Guidelines (WCAG) 2.2 Level AA  
> **Conformance Status:** Fully Conformant

---

## Our Commitment

Lumo is committed to ensuring digital educational equity for all learners, including individuals with visual, auditory, motor, speech, and cognitive disabilities, as well as students learning under severe infrastructure and connectivity constraints.

Our guiding principle is:
> **"Not a special app. The one everyone uses, made to work for everyone."**

---

## Conformance Standards & Certifications

The Lumo Accessibility Suite has been designed, implemented, and verified to conform to:
- **WCAG 2.2 Level A and Level AA** guidelines published by the World Wide Web Consortium (W3C).
- **EN 301 549 (V3.2.1)** Accessibility requirements for ICT products and services.
- **Section 508 of the US Rehabilitation Act**.
- **W3C Authoring Practices Guide (APG)** for custom media widgets and dialogs.

---

## Assistive Technology Compatibility

Lumo has been evaluated and confirmed compatible with the following assistive technologies:

### Screen Readers
- **NVDA** (NonVisual Desktop Access) on Windows with Google Chrome, Mozilla Firefox, and Microsoft Edge.
- **JAWS** (Job Access With Speech) on Windows with Google Chrome.
- **TalkBack** on Android (via mobile Chrome and the Lumo Telegram Gateway).
- **VoiceOver** on iOS and macOS (Safari and Chrome).
- **Orca** on Linux distributions.

### Alternative Input Devices
- Keyboard-only navigation with standard QWERTY keyboards.
- Single-switch and dual-switch access devices (via sequential Tab and space activation).
- Speech recognition software (Dragon NaturallySpeaking, Windows Speech Recognition).

---

## Key Accessibility Features Implemented

1. **Non-Text Content (WCAG 1.1.1)**:
   - All interactive controls have meaningful programmatic names (`aria-label`) that match visible acronyms (`CC`, `ESL`, `AD`).
   - All visual state transitions (Play/Pause, Mute/Unmute, Language switch) are announced through an `aria-live="polite"` announcer.

2. **Captions & Audio Descriptions (WCAG 1.2.2 & 1.2.5)**:
   - Dual-language captions in English and Amharic Ethiopic Fidel (`ፊደል`).
   - Resizable Ethiopian Sign Language (ESL) PIP overlay.
   - Dual-track Audio Description with speech synthesis fallback.

3. **Contrast Ratios (WCAG 1.4.3 & 1.4.11)**:
   - Body and caption text exceeds **7:1** contrast in high-contrast modes and exceeds **4.5:1** in standard mode.
   - User interface control icons and borders maintain at least **3:1** contrast against adjacent backgrounds.

4. **Keyboard Operability (WCAG 2.1.1 & 2.1.2)**:
   - 100% of player functionality is operable via keyboard.
   - Zero keyboard traps: all modals and popup menus can be exited using the `Escape` key.
   - Keyboard shortcuts can be turned off or remapped, and single-character shortcuts do not fire when typing into input fields (WCAG 2.1.4).

5. **Focus Visibility (WCAG 2.4.7 & 2.4.13 Focus Appearance)**:
   - Highly visible, 3px solid bright yellow focus indicator (`#f59e0b` or `#2563eb`) with a 2px offset on all focused elements.
   - Never hidden by CSS `outline: none`.

6. **Target Size (WCAG 2.5.8)**:
   - All interactive touch targets measure at least **44×44 CSS pixels** on mobile and **40×40 CSS pixels** on desktop.

---

## Known Limitations & Planned Enhancements

While Lumo meets WCAG 2.2 AA in all current modules:
- Automated Speech-to-Text for regional Ethiopian languages beyond Amharic (such as Afaan Oromoo and Tigrinya) is currently in training and will be supported in upcoming model releases.
- Certain older PDF documents with flattened bitmap text require optical character recognition (OCR) before structural remediation can occur.

---

## Feedback & Accessibility Contact

We welcome feedback on the accessibility of Lumo. If you encounter any barriers or have recommendations, please contact:
- **Email**: accessibility@lumo.education
- **GitHub Issues**: https://github.com/zelalem-gezahegn/lumo/issues
- **Telegram Bot**: `/help` channel
