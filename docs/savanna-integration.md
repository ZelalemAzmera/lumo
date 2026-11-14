# Integrating Lumo into ALX Savanna Learning Environment

> **A Step-by-Step Engineering Guide for Platform Engineers**

ALX Savanna delivers software engineering, data science, and cloud computing curricula to tens of thousands of learners across Africa. This guide details how to integrate the **Lumo** accessibility player into Savanna's existing learning pages with zero architectural disruption.

---

## The Integration Philosophy

> **"Not a special app. The one everyone uses, made to work for everyone."**

Historically, learning platforms treated accessibility as an afterthought or directed disabled students to a separate, watered-down "accessible portal." Lumo eliminates this division:
1. **Zero CSS Bleed**: Uses **Shadow DOM** (`mode: 'open'`) to completely insulate Lumo's high-contrast styles, focus rings, and controls from Savanna's global Tailwind or Bootstrap stylesheets.
2. **Zero Framework Lock-in**: As a standard W3C Web Component (`<lumo-player>`), it works natively in plain HTML, React, Next.js, Vue, or Angular.
3. **No External Runtime Dependencies**: Lumo is self-contained in a single 41 KB script. No React or third-party libraries needed on the host page.

---

## Before & After Code Comparison

### Before: Standard Inaccessible Video Embed in Savanna
```html
<!-- Typical Savanna lesson card with standard HTML5 video -->
<div class="lesson-media-wrapper">
  <video controls width="100%">
    <source src="https://media.savanna.alx.et/videos/web-architecture-01.mp4" type="video/mp4">
    <!-- No captions, no sign language, no audio description, inaccessible to screen readers -->
  </video>
</div>
```
**Barriers Introduced:**
- Deaf learners cannot follow video audio without captions.
- Blind learners receive no audio description of visual diagrams or code snippets.
- Keyboard-only navigation depends on varying browser-native controls, often failing WCAG 2.1.1.
- Low-bandwidth learners must stream the full 1080p video stream.

---

### After: Lumo-Enhanced Accessible Savanna Embed
```html
<!-- Step 1: Add Lumo script in document head or before closing body tag -->
<script src="/dist/lumo.min.js" defer></script>

<!-- Step 2: Replace standard video tag with <lumo-player> -->
<div class="lesson-media-wrapper">
  <lumo-player
    src="https://media.savanna.alx.et/videos/web-architecture-01.mp4"
    captions-src="/captions/web-architecture-en.vtt"
    captions-am-src="/captions/web-architecture-am.vtt"
    esl-src="https://media.savanna.alx.et/sign-language/web-architecture-01.mp4"
    ad-src="https://media.savanna.alx.et/audio-described/web-architecture-01.mp4"
    theme="high-contrast-black"
    caption-size="125%">
  </lumo-player>
</div>
```

---

## Web Component Attributes Reference

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | **Required** | URL of the primary video file. |
| `captions-src` | `string` | Optional | URL of English WebVTT captions track. |
| `captions-am-src` | `string` | Optional | URL of Amharic WebVTT captions track (`.vtt`). |
| `esl-src` | `string` | Optional | URL of Ethiopian Sign Language interpreter video. |
| `ad-src` | `string` | Optional | URL of Audio-Described video master track. |
| `theme` | `string` | `default` | High contrast theme: `default`, `high-contrast-yellow`, `high-contrast-blue`. |
| `caption-size` | `string` | `100%` | Scale factor for captions text: `100%`, `125%`, `150%`, `175%`, `200%`. |
| `autoplay` | `boolean` | `false` | Automatically starts playback (muted per WCAG 1.4.2). |

---

## Programmatic Control (JavaScript API)

Platform developers can interact with `<lumo-player>` via standard DOM properties and methods:

```javascript
const player = document.querySelector('lumo-player');

// Playback control
await player.play();
player.pause();
player.seek(45.5); // Seek to 45.5 seconds

// Accessibility feature toggles
player.toggleCaptions(); // Cycles None -> EN -> AM
player.toggleESL();      // Opens/closes Sign Language PIP window
player.toggleAD();       // Swaps to Audio Described video track

// Listen to accessibility events
player.addEventListener('lumo-caption-change', (e) => {
  console.log('Active language:', e.detail.language); // 'en' or 'am'
});

player.addEventListener('lumo-esl-toggle', (e) => {
  console.log('Sign language window active:', e.detail.active);
});
```

---

## Offline Learning Mode in Savanna

For students traveling to regional areas with intermittent connectivity, Savanna can provide an "Export for Offline Study" button that calls Lumo's offline package API:

```javascript
async function downloadOfflineLesson(lessonId) {
  const response = await fetch(`/api/v1/packages/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Lumo-Key': 'savanna_auth_token'
    },
    body: JSON.stringify({
      lesson_id: lessonId,
      title: 'Savanna: Web Architecture & Semantic HTML'
    })
  });

  const { download_url } = await response.json();
  window.location.href = download_url; // Triggers sub-10MB zip download
}
```

---

## Live Verification
A full demonstration of this integration is available at:
`samples/savanna-demo.html`
