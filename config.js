/**
 * ============================================
 * CONTACT HUB CONFIGURATION
 * ============================================
 * Edit this file to customize your contact page.
 * All contact methods, settings, and personal info
 * are defined here in one place.
 */

const CONFIG = {
  // ─────────────────────────────────────────
  // PERSONAL INFO
  // ─────────────────────────────────────────
  name: "Salma Kim",
  tagline: "Designer & Developer", // Optional: set to "" to hide

  // ─────────────────────────────────────────
  // DESIGN
  // ─────────────────────────────────────────
  accentColor: {
    light: "#0066cc", // Accent color for light mode
    dark: "#66b3ff",  // Accent color for dark mode
  },

  // ─────────────────────────────────────────
  // FEATURES
  // ─────────────────────────────────────────
  features: {
    showSearch: true,        // Show search/filter input
    showLocalTime: true,     // Show visitor's local time
    showWeather: true,       // Show weather toggle (privacy-first, off by default)
    showQrCode: true,        // Show QR code for page URL
    collapseLowPriority: true, // Collapse items with priority > 2
  },

  // ─────────────────────────────────────────
  // WEATHER API (Optional)
  // ─────────────────────────────────────────
  // Using wttr.in - free, no API key required
  // Alternative: set weatherApiUrl to your preferred endpoint
  weatherApiUrl: "https://wttr.in/?format=j1",

  // ─────────────────────────────────────────
  // CONTACT METHODS
  // ─────────────────────────────────────────
  // Groups: "contact", "messaging", "social", "other"
  // Priority: 1 = highest, 3 = lowest (3 = collapsed by default)
  //
  // Fields:
  //   id         - unique identifier
  //   group      - "contact" | "messaging" | "social" | "other"
  //   label      - display name
  //   value      - the handle/address shown to user
  //   href       - link (mailto:, tel:, sms:, https://, etc.)
  //   icon       - emoji or text icon
  //   priority   - 1, 2, or 3
  //   copyValue  - (optional) what to copy, defaults to value
  //   note       - (optional) short description
  //
  contacts: [
    // ─── CONTACT ───
    {
      id: "email",
      group: "contact",
      label: "Email",
      value: "hello@salmas.kim",
      href: "mailto:hello@salmas.kim",
      icon: "✉️",
      priority: 1,
      note: "Best way to reach me",
    },
    {
      id: "phone",
      group: "contact",
      label: "Phone",
      value: "+1 (555) 123-4567",
      href: "tel:+15551234567",
      icon: "📞",
      priority: 1,
      copyValue: "+15551234567",
    },
    {
      id: "sms",
      group: "contact",
      label: "Text",
      value: "+1 (555) 123-4567",
      href: "sms:+15551234567",
      icon: "💬",
      priority: 2,
      copyValue: "+15551234567",
      note: "For quick messages",
    },

    // ─── MESSAGING ───
    {
      id: "signal",
      group: "messaging",
      label: "Signal",
      value: "+1 (555) 123-4567",
      href: "https://signal.me/#p/+15551234567",
      icon: "🔒",
      priority: 1,
      copyValue: "+15551234567",
      note: "Preferred for private chats",
    },
    {
      id: "discord",
      group: "messaging",
      label: "Discord",
      value: "salmakim",
      href: "https://discord.com/users/salmakim",
      icon: "🎮",
      priority: 2,
    },
    {
      id: "telegram",
      group: "messaging",
      label: "Telegram",
      value: "@salmakim",
      href: "https://t.me/salmakim",
      icon: "✈️",
      priority: 3,
    },

    // ─── SOCIAL ───
    {
      id: "instagram",
      group: "social",
      label: "Instagram",
      value: "@salmakim",
      href: "https://instagram.com/salmakim",
      icon: "📷",
      priority: 2,
    },
    {
      id: "twitter",
      group: "social",
      label: "X / Twitter",
      value: "@salmakim",
      href: "https://x.com/salmakim",
      icon: "𝕏",
      priority: 2,
    },
    {
      id: "linkedin",
      group: "social",
      label: "LinkedIn",
      value: "salmakim",
      href: "https://linkedin.com/in/salmakim",
      icon: "💼",
      priority: 2,
    },
    {
      id: "github",
      group: "social",
      label: "GitHub",
      value: "salmakim",
      href: "https://github.com/salmakim",
      icon: "🐙",
      priority: 2,
    },
    {
      id: "threads",
      group: "social",
      label: "Threads",
      value: "@salmakim",
      href: "https://threads.net/@salmakim",
      icon: "🧵",
      priority: 3,
    },
    {
      id: "bluesky",
      group: "social",
      label: "Bluesky",
      value: "@salma.kim",
      href: "https://bsky.app/profile/salma.kim",
      icon: "🦋",
      priority: 3,
    },

    // ─── OTHER ───
    {
      id: "website",
      group: "other",
      label: "Website",
      value: "salmas.kim",
      href: "https://salmas.kim",
      icon: "🌐",
      priority: 1,
    },
    {
      id: "calendar",
      group: "other",
      label: "Book a Call",
      value: "Schedule 30min",
      href: "https://cal.com/salmakim/30min",
      icon: "📅",
      priority: 2,
      note: "Pick a time that works",
    },
  ],
};

// Export for use in app.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
