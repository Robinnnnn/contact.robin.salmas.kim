/**
 * ============================================
 * CONTACT HUB APPLICATION
 * ============================================
 * Renders the contact page from CONFIG
 */

(function () {
  "use strict";

  // ─────────────────────────────────────────
  // DOM ELEMENTS
  // ─────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const nameEl = $("name");
  const taglineEl = $("tagline");
  const localContextEl = $("local-context");
  const localTimeEl = $("local-time");
  const localWeatherEl = $("local-weather");
  const weatherToggleEl = $("weather-toggle");
  const weatherDisplayEl = $("weather-display");
  const searchContainerEl = $("search-container");
  const searchInputEl = $("search-input");
  const searchClearEl = $("search-clear");
  const contactsListEl = $("contacts-list");
  const showMoreContainerEl = $("show-more-container");
  const showMoreBtnEl = $("show-more-btn");
  const qrSectionEl = $("qr-section");
  const qrCanvasEl = $("qr-canvas");
  const toastEl = $("toast");

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────
  let showLowPriority = false;
  let timeInterval = null;

  // ─────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────
  function init() {
    // Apply accent colors from config
    applyAccentColors();

    // Render header
    nameEl.textContent = CONFIG.name;
    taglineEl.textContent = CONFIG.tagline || "";
    document.title = `Contact — ${CONFIG.name}`;

    // Setup features based on config
    setupLocalContext();
    setupSearch();
    renderContacts();
    setupShowMore();
    setupQrCode();
  }

  // ─────────────────────────────────────────
  // ACCENT COLORS
  // ─────────────────────────────────────────
  function applyAccentColors() {
    const { accentColor } = CONFIG;
    if (!accentColor) return;

    const style = document.createElement("style");
    style.textContent = `
      :root {
        --color-accent: ${accentColor.light};
        --color-accent-hover: ${adjustColor(accentColor.light, -20)};
        --color-accent-bg: ${hexToRgba(accentColor.light, 0.08)};
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --color-accent: ${accentColor.dark};
          --color-accent-hover: ${adjustColor(accentColor.dark, 20)};
          --color-accent-bg: ${hexToRgba(accentColor.dark, 0.1)};
        }
      }
    `;
    document.head.appendChild(style);
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function adjustColor(hex, amount) {
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  // ─────────────────────────────────────────
  // LOCAL CONTEXT (TIME & WEATHER)
  // ─────────────────────────────────────────
  function setupLocalContext() {
    const { showLocalTime, showWeather } = CONFIG.features;

    if (!showLocalTime && !showWeather) {
      localContextEl.hidden = true;
      return;
    }

    // Local time
    if (showLocalTime) {
      updateLocalTime();
      timeInterval = setInterval(updateLocalTime, 1000);
    } else {
      localTimeEl.hidden = true;
    }

    // Weather
    if (showWeather) {
      weatherToggleEl.addEventListener("click", loadWeather);
    } else {
      localWeatherEl.hidden = true;
    }
  }

  function updateLocalTime() {
    const now = new Date();
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    const formatted = now.toLocaleString(undefined, options);
    localTimeEl.textContent = formatted;
  }

  async function loadWeather() {
    weatherToggleEl.textContent = "Loading...";
    weatherToggleEl.disabled = true;

    try {
      const response = await fetch(CONFIG.weatherApiUrl);
      if (!response.ok) throw new Error("Weather fetch failed");

      const data = await response.json();
      const current = data.current_condition?.[0];

      if (!current) throw new Error("No weather data");

      const temp = current.temp_C || current.temp_F;
      const unit = current.temp_C ? "°C" : "°F";
      const desc = current.weatherDesc?.[0]?.value || "";

      weatherToggleEl.hidden = true;
      weatherDisplayEl.hidden = false;
      weatherDisplayEl.innerHTML = `
        <span class="weather-temp">${temp}${unit} ${desc}</span>
        <span class="weather-note">Approximate location from IP; nothing stored.</span>
      `;
    } catch (e) {
      // Silently fail - hide the toggle, show nothing
      localWeatherEl.hidden = true;
    }
  }

  // ─────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────
  function setupSearch() {
    if (!CONFIG.features.showSearch) {
      searchContainerEl.hidden = true;
      return;
    }

    searchInputEl.addEventListener("input", handleSearch);
    searchClearEl.addEventListener("click", clearSearch);
  }

  function handleSearch() {
    const query = searchInputEl.value.toLowerCase().trim();
    searchClearEl.hidden = !query;

    const cards = contactsListEl.querySelectorAll(".contact-card");
    let visibleCount = 0;

    cards.forEach((card) => {
      const text = card.dataset.searchText || "";
      const matches = !query || text.includes(query);
      const isLowPriority = card.classList.contains("low-priority");

      if (matches && (!isLowPriority || showLowPriority || query)) {
        card.hidden = false;
        visibleCount++;
      } else {
        card.hidden = true;
      }
    });

    // Show/hide group headings based on visible cards
    const groups = contactsListEl.querySelectorAll(".contact-group");
    groups.forEach((group) => {
      const visibleCards = group.querySelectorAll(".contact-card:not([hidden])");
      group.hidden = visibleCards.length === 0;
    });

    // Show empty state if no results
    let emptyState = contactsListEl.querySelector(".empty-state");
    if (visibleCount === 0 && query) {
      if (!emptyState) {
        emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.textContent = "No matches found";
        contactsListEl.appendChild(emptyState);
      }
      emptyState.hidden = false;
    } else if (emptyState) {
      emptyState.hidden = true;
    }
  }

  function clearSearch() {
    searchInputEl.value = "";
    searchClearEl.hidden = true;
    handleSearch();
    searchInputEl.focus();
  }

  // ─────────────────────────────────────────
  // RENDER CONTACTS
  // ─────────────────────────────────────────
  function renderContacts() {
    const groups = groupContacts(CONFIG.contacts);
    const groupOrder = ["contact", "messaging", "social", "other"];
    const groupLabels = {
      contact: "Contact",
      messaging: "Messaging",
      social: "Social",
      other: "Other",
    };

    contactsListEl.innerHTML = "";

    groupOrder.forEach((groupId) => {
      const contacts = groups[groupId];
      if (!contacts || contacts.length === 0) return;

      // Sort by priority
      contacts.sort((a, b) => (a.priority || 2) - (b.priority || 2));

      const groupEl = document.createElement("section");
      groupEl.className = "contact-group";
      groupEl.dataset.group = groupId;

      const headingEl = document.createElement("h2");
      headingEl.className = "group-heading";
      headingEl.textContent = groupLabels[groupId] || groupId;
      groupEl.appendChild(headingEl);

      const listEl = document.createElement("ul");
      listEl.className = "contact-list";

      contacts.forEach((contact) => {
        const cardEl = createContactCard(contact);
        listEl.appendChild(cardEl);
      });

      groupEl.appendChild(listEl);
      contactsListEl.appendChild(groupEl);
    });
  }

  function groupContacts(contacts) {
    return contacts.reduce((acc, contact) => {
      const group = contact.group || "other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(contact);
      return acc;
    }, {});
  }

  function createContactCard(contact) {
    const li = document.createElement("li");
    li.className = "contact-card";
    li.dataset.id = contact.id;
    li.dataset.searchText = [
      contact.label,
      contact.value,
      contact.note,
      contact.group,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const isLowPriority = (contact.priority || 2) > 2;
    if (isLowPriority) {
      li.classList.add("low-priority");
      if (CONFIG.features.collapseLowPriority) {
        li.hidden = true;
      }
    }

    li.innerHTML = `
      <span class="card-icon" aria-hidden="true">${contact.icon}</span>
      <div class="card-info">
        <div class="card-label">${escapeHtml(contact.label)}</div>
        <div class="card-value">${escapeHtml(contact.value)}</div>
        ${contact.note ? `<div class="card-note">${escapeHtml(contact.note)}</div>` : ""}
      </div>
      <div class="card-actions">
        <a
          href="${escapeHtml(contact.href)}"
          class="card-btn btn-primary"
          target="${contact.href.startsWith("http") ? "_blank" : "_self"}"
          rel="${contact.href.startsWith("http") ? "noopener noreferrer" : ""}"
        >
          Open
        </a>
        <button
          type="button"
          class="card-btn btn-secondary"
          data-copy="${escapeHtml(contact.copyValue || contact.value)}"
          aria-label="Copy ${escapeHtml(contact.label)}"
        >
          Copy
        </button>
      </div>
    `;

    // Copy button handler
    const copyBtn = li.querySelector("[data-copy]");
    copyBtn.addEventListener("click", () => {
      copyToClipboard(copyBtn.dataset.copy);
    });

    return li;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ─────────────────────────────────────────
  // COPY TO CLIPBOARD
  // ─────────────────────────────────────────
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied!");
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("Copied!");
    }
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.add("visible");

    setTimeout(() => {
      toastEl.classList.remove("visible");
      setTimeout(() => {
        toastEl.hidden = true;
      }, 200);
    }, 1500);
  }

  // ─────────────────────────────────────────
  // SHOW MORE / COLLAPSE
  // ─────────────────────────────────────────
  function setupShowMore() {
    if (!CONFIG.features.collapseLowPriority) {
      showMoreContainerEl.hidden = true;
      return;
    }

    const lowPriorityCards = contactsListEl.querySelectorAll(".low-priority");
    if (lowPriorityCards.length === 0) {
      showMoreContainerEl.hidden = true;
      return;
    }

    showMoreContainerEl.hidden = false;
    showMoreBtnEl.querySelector(".show-more-text").textContent =
      `Show ${lowPriorityCards.length} more`;

    showMoreBtnEl.addEventListener("click", toggleShowMore);
  }

  function toggleShowMore() {
    showLowPriority = !showLowPriority;
    showMoreBtnEl.setAttribute("aria-expanded", showLowPriority);

    const lowPriorityCards = contactsListEl.querySelectorAll(".low-priority");
    lowPriorityCards.forEach((card) => {
      card.hidden = !showLowPriority;
    });

    showMoreBtnEl.querySelector(".show-more-text").textContent = showLowPriority
      ? "Show less"
      : `Show ${lowPriorityCards.length} more`;

    // Re-evaluate group visibility
    handleSearch();
  }

  // ─────────────────────────────────────────
  // QR CODE
  // ─────────────────────────────────────────
  function setupQrCode() {
    if (!CONFIG.features.showQrCode) {
      qrSectionEl.hidden = true;
      return;
    }

    // Generate QR code for current page URL
    const url = window.location.href;

    // Get colors from CSS
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--color-bg").trim() || "#ffffff";
    const fg = styles.getPropertyValue("--color-text").trim() || "#000000";

    QRCode.toCanvas(qrCanvasEl, url, {
      size: 120,
      background: bg,
      foreground: fg,
    });

    // Re-render on color scheme change
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        const newStyles = getComputedStyle(document.documentElement);
        const newBg = newStyles.getPropertyValue("--color-bg").trim() || "#ffffff";
        const newFg = newStyles.getPropertyValue("--color-text").trim() || "#000000";
        QRCode.toCanvas(qrCanvasEl, url, {
          size: 120,
          background: newBg,
          foreground: newFg,
        });
      });
    }
  }

  // ─────────────────────────────────────────
  // START
  // ─────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
