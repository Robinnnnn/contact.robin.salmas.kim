A minimal contact page.

## Features

- Light/dark mode via `prefers-color-scheme`
- Live weather and local time display
- Timezone delta for visitors
- QR code modal for mobile sharing
- Staggered fade-in animations
- No cookies, no analytics, no trackers

## Files

```
├── index.html     # Page content and inline JS
├── styles.css     # All styles
├── qr.js          # QR code generator
└── README.md
```

## Local Development

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Setup (after cloning)

Enable the pre-commit hook for automatic cache-busting:

```bash
git config core.hooksPath .githooks
```

This auto-updates version query params on CSS/JS files when you commit changes.

## Deployment

Static files - deploy anywhere (Cloudflare Pages, Vercel, Netlify, etc.)

## Vibe Coding

Using an AI assistant? See [AGENTS.md](./AGENTS.md) for codebase instructions.