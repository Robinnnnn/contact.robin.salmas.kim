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
`index.html` lines ~25-65 — Each contact is a `.row` div:
```html
<div class="row">
  <span>label</span>
  <a href="..." target="_blank" rel="noopener">value</a>
</div>
```

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

### Animations
- Row fade-in: `.row` starts with `opacity: 0`, gets `.visible` class via JS
- QR modal: `.qr-modal` uses `opacity`/`visibility` transition

## Conventions

- All lowercase text
- Monospace font throughout
- No external dependencies (vanilla HTML/CSS/JS)
- Weather from Open-Meteo API (free, no key)
- Weather icons from OpenWeatherMap

## Testing

```bash
python3 -m http.server 8000
# http://localhost:8000
```

To test timezone display, temporarily change `visitorTz` in the script:
```javascript
const visitorTz = 'America/New_York'; // simulates EST
```
