# Contact Hub

A minimal, privacy-first personal contact page. One link to share all the ways to reach you.

## Features

- **Single config file** — Edit `config.js` to customize everything
- **Light/Dark mode** — Automatic via `prefers-color-scheme`
- **Privacy-first** — No cookies, no analytics, no trackers
- **Responsive** — Works on all devices
- **Accessible** — ARIA labels, keyboard navigation, reduced motion support
- **Fast** — Static files, no build step, system fonts
- **QR Code** — Scannable code for in-person sharing
- **Local context** — Shows visitor's local time; optional weather

## Quick Start

1. Open `config.js` in any text editor
2. Update your name, tagline, and contact methods
3. Deploy to Cloudflare Pages (see below)

## Customization

All customization is done in `config.js`.

### Personal Info

```javascript
name: "Your Name",
tagline: "Your tagline here", // Set to "" to hide
```

### Accent Color

```javascript
accentColor: {
  light: "#0066cc", // Color for light mode
  dark: "#66b3ff",  // Color for dark mode
},
```

### Features

Toggle features on/off:

```javascript
features: {
  showSearch: true,         // Filter input
  showLocalTime: true,      // Visitor's local time
  showWeather: true,        // Weather toggle (privacy-first)
  showQrCode: true,         // QR code for page URL
  collapseLowPriority: true, // Collapse priority 3 items
},
```

### Contact Methods

Each contact method has these fields:

| Field       | Required | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| `id`        | Yes      | Unique identifier                              |
| `group`     | Yes      | `"contact"`, `"messaging"`, `"social"`, `"other"` |
| `label`     | Yes      | Display name (e.g., "Email")                   |
| `value`     | Yes      | Handle/address shown to user                   |
| `href`      | Yes      | Link (`mailto:`, `tel:`, `sms:`, `https://`)   |
| `icon`      | Yes      | Emoji or text icon                             |
| `priority`  | Yes      | `1` (high), `2` (normal), `3` (collapsed)      |
| `copyValue` | No       | What to copy (defaults to `value`)             |
| `note`      | No       | Short description                              |

#### Adding a Contact

```javascript
{
  id: "email",
  group: "contact",
  label: "Email",
  value: "you@example.com",
  href: "mailto:you@example.com",
  icon: "✉️",
  priority: 1,
  note: "Best way to reach me",
},
```

#### Removing a Contact

Delete the entire object (including the curly braces and comma).

#### Reordering Contacts

Contacts are sorted by:
1. Group order: contact → messaging → social → other
2. Priority within each group (1 first, 3 last)

To change order, adjust the `priority` values.

#### Common href Formats

| Type     | Format                           | Example                                    |
| -------- | -------------------------------- | ------------------------------------------ |
| Email    | `mailto:email@example.com`       | `mailto:hello@example.com`                 |
| Phone    | `tel:+1234567890`                | `tel:+15551234567`                         |
| SMS      | `sms:+1234567890`                | `sms:+15551234567`                         |
| Signal   | `https://signal.me/#p/+1234567890` | `https://signal.me/#p/+15551234567`      |
| WhatsApp | `https://wa.me/1234567890`       | `https://wa.me/15551234567`                |
| Telegram | `https://t.me/username`          | `https://t.me/salmakim`                    |
| Discord  | `https://discord.com/users/id`   | `https://discord.com/users/salmakim`       |
| Website  | `https://example.com`            | `https://salmas.kim`                       |
| Calendar | `https://cal.com/username/30min` | `https://cal.com/salmakim/30min`           |

### Weather API

The default weather API is `wttr.in` (free, no API key required). To change:

```javascript
weatherApiUrl: "https://your-weather-api.com/endpoint",
```

Weather is always off by default. Visitors must click "Load weather" to fetch it.

## Files

```
contact.salmas.kim/
├── index.html     # Main HTML (rarely needs editing)
├── styles.css     # All styles (edit for custom theming)
├── config.js      # ← Edit this file to customize
├── qrcode.js      # QR code generator (no external deps)
├── app.js         # Application logic
└── README.md      # This file
```

## Cloudflare Pages Deployment

### Option 1: Direct Upload (Easiest)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application** → **Pages** → **Upload assets**
3. Create a new project and name it (e.g., `contact-salmas-kim`)
4. Drag and drop all files:
   - `index.html`
   - `styles.css`
   - `config.js`
   - `qrcode.js`
   - `app.js`
5. Click **Deploy site**
6. Your site is live at `https://your-project.pages.dev`

### Option 2: Git Integration

1. Push the files to a GitHub/GitLab repository
2. Go to Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Connect to Git**
3. Select your repository
4. Configure build settings:
   - **Build command:** (leave empty)
   - **Build output directory:** `/` (root)
5. Click **Save and Deploy**

### Custom Domain

1. In your Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `contact.salmas.kim`)
4. Follow the DNS configuration prompts

## Local Development

No build step required. Just open `index.html` in a browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Or use a local server
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome for Android)

## Privacy

This site:
- Sets **no cookies**
- Has **no analytics or tracking**
- Makes **no external requests** (except optional weather, which is off by default)
- Stores **nothing** on visitor devices
- Weather uses IP geolocation (approximate city only, nothing stored)

## License

MIT — Use freely for personal or commercial projects.
