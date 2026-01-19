# AGENTS.md

Instructions for AI coding assistants.

## Structure

```
├── index.html     # All content + inline JS
├── styles.css     # All styles (CSS variables for theming)
├── qr.js          # QR code generator (standalone)
└── README.md      # Human-readable overview
```

## Key Locations

### Contact Methods
`index.html` lines ~27-70 — Each contact is a `.row` div:
```html
<div class="row">
  <span>label</span>
  <a href="..." target="_blank" rel="noopener">value</a>
</div>
```
Some values use `.censored` spans instead of links (Signal, Instagram):
```html
<div class="row">
  <span>signal</span>
  <span class="censored">@xxxx.99</span>
</div>
```

### Finances Nav
`index.html` lines ~74-170 — Hidden by default, toggled via `#financeBtn`:
```html
<nav class="finances-nav hidden" id="financesNav">
  <div class="row">
    <span>venmo</span>
    <span class="value-with-copy">
      <span class="copyable-value">@robin-kim-3</span>
      <button class="copy-btn" data-copy="@robin-kim-3">...</button>
    </span>
  </div>
</nav>
```
Payment methods: venmo, zelle, usdc, eth, btc, sol.

### Signature Panel
`index.html` lines ~179-201 — Cryptographic verification panel:
```html
<div class="signature-panel" id="signaturePanel">
  <div class="signature-divider"></div>
  <pre class="signature-message">signed message content...</pre>
  <div class="signature-divider"></div>
  <code class="signature-full">0x0727fc45...</code>
</div>
```
Triggered by `.signature-spine` button (lines ~203-206) on right edge.

### Utility Buttons
`index.html` lines ~208-231 — Bottom-right corner controls:
- `{}` — Source link to GitHub repo
- `#financeBtn` — Toggle finances panel
- `#themeBtn` — Toggle light/dark theme
- `#qrBtn` — Toggle QR code panel

### Location & Timezone
`index.html` in the inline `<script>` block:
- `ROBIN_TZ` — Timezone (e.g., `'America/Denver'`)
- `DENVER_LAT`, `DENVER_LNG` — Coordinates for weather API
- Status text updates in `fetchWeather()` and `updateTime()`

### Colors
`styles.css` lines ~7-20 — CSS variables in `:root` and `@media (prefers-color-scheme: dark)`:
- `--text-primary` — Labels
- `--text-secondary` — Values/links
- `--text-tertiary` — Header
- `--text-status` — Status strip

## Panel Coordination

Only one panel visible at a time: contact, finances, QR, or signature.

Toggle behavior:
- Opening finances closes QR (if open)
- Opening signature closes current view (contact/finances/QR), remembers previous view
- Closing signature returns to previous view
- QR can overlay contact or finances without hiding them

## Animations

| Animation | Duration | Delay |
|-----------|----------|-------|
| Row stagger | — | i * 75ms |
| Panel slide | 0.5s | — |
| Signature spine reveal | 0.8s | 0.5s |
| Title decoration chars | 0.4s | 0.3s + i*0.05s |

- Row fade-in: `.row` starts with `opacity: 0`, gets `.visible` class via JS
- QR panel: `.qr-panel` uses `opacity`/`visibility` transition
- Reduced motion: All animations skip when `prefers-reduced-motion: reduce`

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.censored` | blur(3.5px), non-selectable, pointer-events: none |
| `.value-with-copy` | inline flex container with copy button |
| `.copy-btn` | clipboard button with checkmark feedback |
| `.signature-panel` | full-width verification panel |
| `.signature-spine` | right-edge toggle button |
| `.finances-nav` | payment methods panel |
| `.hidden` | display: none utility |

## Conventions

- All lowercase text
- Monospace font throughout
- No external dependencies (vanilla HTML/CSS/JS)
- Weather from Open-Meteo API (free, no key)
- Weather icons from OpenWeatherMap

## Setup (after cloning)

Enable the pre-commit hook for automatic cache-busting:

```bash
git config core.hooksPath .githooks
```

This auto-updates `?v=` query params on CSS/JS files when you commit changes to `styles.css` or `qr.js`.

## Testing

```bash
python3 -m http.server 8000
# http://localhost:8000
```

To test timezone display, temporarily change `visitorTz` in the script:
```javascript
const visitorTz = 'America/New_York'; // simulates EST
```
