const DEFAULT_APPS = [
  { id: "google", name: "Google", domain: "www.google.com", searchUrlTemplate: "https://www.google.com/search?q={query}", builtIn: true },
  { id: "chatgpt", name: "ChatGPT", domain: "chatgpt.com", searchUrlTemplate: "https://chat.openai.com/?q={query}", builtIn: true },
  { id: "perplexity", name: "Perplexity", domain: "www.perplexity.ai", searchUrlTemplate: "https://www.perplexity.ai/search?q={query}", builtIn: true },
  { id: "claude", name: "Claude", domain: "claude.ai", searchUrlTemplate: "https://claude.ai/new?q={query}", builtIn: true },
  { id: "gemini", name: "Gemini", domain: "gemini.google.com", searchUrlTemplate: "https://gemini.google.com/app?q={query}", builtIn: true },
  { id: "youtube", name: "YouTube", domain: "www.youtube.com", searchUrlTemplate: "https://www.youtube.com/results?search_query={query}", builtIn: true },
  { id: "ai-mode", name: "AI Mode", domain: "www.google.com", searchUrlTemplate: "https://www.google.com/aimode?q={query}", builtIn: true },
  { id: "grok", name: "Grok", domain: "grok.com", searchUrlTemplate: "https://grok.com/?q={query}", builtIn: true }
];
const CUSTOM_APPS_KEY = "customApps";
const COLOR_KEY = "themeColor";
const APP_PREFS_KEY = "appPrefs";
const WALLPAPER_KEY = "customWallpaper";
const USER_NAME = "Srivatsav";

const alreadyInitialized = !!window.__multiSearchTabInit;
window.__multiSearchTabInit = true;

const form = document.getElementById("search-form");
const queryInput = document.getElementById("query");
const appsGrid = document.getElementById("apps-grid");
const statusEl = document.getElementById("status");
const greetingEl = document.getElementById("greeting");
const toggleManageBtn = document.getElementById("toggle-manage");
const managePanel = document.getElementById("manage-panel");
const addAppForm = document.getElementById("add-app-form");
const appNameInput = document.getElementById("app-name");
const appUrlInput = document.getElementById("app-url");
const customAppsList = document.getElementById("custom-apps-list");
const wallpaperPencilBtn = document.getElementById("wallpaper-pencil");
const customizePanel = document.getElementById("customize-panel");
const uploadWallpaperBtn = document.getElementById("upload-wallpaper");
const removeWallpaperBtn = document.getElementById("remove-wallpaper");
const wallpaperInput = document.getElementById("wallpaper-input");
const colorButtons = Array.from(document.querySelectorAll(".color-btn"));

let customApps = [];
let appOrder = [];
let hiddenAppIds = new Set();
let draggingAppId = null;
let isManageMode = false;

function setColorTheme(color) {
  const palettes = {
    black: {
      bg: "#0f0f10",
      panel: "#1a1b1d",
      panelHover: "#242629",
      panelBorder: "#34373c",
      textPrimary: "#eceff3",
      textMuted: "#a6adb8",
      accent: "#111111",
      focus: "rgba(150, 150, 150, 0.32)"
    },
    white: {
      bg: "#ffffff",
      panel: "#ffffff",
      panelHover: "#f3f4f6",
      panelBorder: "#d7dbe1",
      textPrimary: "#202124",
      textMuted: "#5f6368",
      accent: "#ffffff",
      focus: "rgba(66, 133, 244, 0.28)"
    },
    blue: {
      bg: "#eef4ff",
      panel: "#f9fbff",
      panelHover: "#edf3ff",
      panelBorder: "#cfdcf8",
      textPrimary: "#1f2a44",
      textMuted: "#5c6f96",
      accent: "#4285f4",
      focus: "rgba(66, 133, 244, 0.28)"
    },
    green: {
      bg: "#edf8f1",
      panel: "#f7fdf9",
      panelHover: "#ebf8ef",
      panelBorder: "#c9e8d2",
      textPrimary: "#1f3a2a",
      textMuted: "#567962",
      accent: "#34a853",
      focus: "rgba(52, 168, 83, 0.28)"
    },
    orange: {
      bg: "#fff6ea",
      panel: "#fffcf7",
      panelHover: "#fff3e1",
      panelBorder: "#f6dcc0",
      textPrimary: "#3f2b15",
      textMuted: "#8a6845",
      accent: "#fb8c00",
      focus: "rgba(251, 140, 0, 0.3)"
    },
    rose: {
      bg: "#fff1f6",
      panel: "#fff8fb",
      panelHover: "#ffeef5",
      panelBorder: "#f8d1df",
      textPrimary: "#4a1f33",
      textMuted: "#8f6076",
      accent: "#e91e63",
      focus: "rgba(233, 30, 99, 0.28)"
    },
    purple: {
      bg: "#f4f0ff",
      panel: "#faf8ff",
      panelHover: "#f0ebff",
      panelBorder: "#dccff7",
      textPrimary: "#2f2446",
      textMuted: "#6f6294",
      accent: "#7e57c2",
      focus: "rgba(126, 87, 194, 0.28)"
    },
    teal: {
      bg: "#e9f7f5",
      panel: "#f5fcfb",
      panelHover: "#e7f6f3",
      panelBorder: "#c7e8e2",
      textPrimary: "#1b3a36",
      textMuted: "#4d7973",
      accent: "#00897b",
      focus: "rgba(0, 137, 123, 0.28)"
    },
    amber: {
      bg: "#fff9e8",
      panel: "#fffdf6",
      panelHover: "#fff6dc",
      panelBorder: "#f4e2b1",
      textPrimary: "#3a2f16",
      textMuted: "#84704a",
      accent: "#ffb300",
      focus: "rgba(255, 179, 0, 0.3)"
    },
    indigo: {
      bg: "#eef0ff",
      panel: "#f8f9ff",
      panelHover: "#ebedff",
      panelBorder: "#cfd3f8",
      textPrimary: "#242b4a",
      textMuted: "#636d96",
      accent: "#3949ab",
      focus: "rgba(57, 73, 171, 0.28)"
    }
  };

  const chosen = palettes[color] ? color : "blue";
  const palette = palettes[chosen];
  document.documentElement.setAttribute("data-color", chosen);
  document.documentElement.style.setProperty("--bg", palette.bg);
  document.documentElement.style.setProperty("--panel", palette.panel);
  document.documentElement.style.setProperty("--panel-hover", palette.panelHover);
  document.documentElement.style.setProperty("--panel-border", palette.panelBorder);
  document.documentElement.style.setProperty("--text-primary", palette.textPrimary);
  document.documentElement.style.setProperty("--text-muted", palette.textMuted);
  document.documentElement.style.setProperty("--accent", palette.accent);
  document.documentElement.style.setProperty("--focus", palette.focus);
  colorButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.color === chosen));
}

function saveColorTheme(color) {
  chrome.storage.sync.set({ [COLOR_KEY]: color });
  try {
    localStorage.setItem(COLOR_KEY, color);
  } catch (_) {
    // Ignore localStorage failures; sync storage remains source of truth.
  }
}

function loadColorTheme() {
  let localColor = null;
  try {
    localColor = localStorage.getItem(COLOR_KEY);
  } catch (_) {
    localColor = null;
  }
  if (localColor) {
    setColorTheme(localColor);
  }
  chrome.storage.sync.get([COLOR_KEY], (result) => {
    const color = result[COLOR_KEY] || localColor || "blue";
    setColorTheme(color);
    try {
      localStorage.setItem(COLOR_KEY, color);
    } catch (_) {
      // Ignore localStorage failures.
    }
  });
}

function applyWallpaper(dataUrl) {
  const hasWallpaper = !!dataUrl;
  removeWallpaperBtn.classList.toggle("hidden", !hasWallpaper);
  uploadWallpaperBtn.textContent = hasWallpaper ? "Change Wallpaper" : "Add Wallpaper";
  document.body.classList.toggle("wallpaper-mode", hasWallpaper);

  if (!dataUrl) {
    document.body.style.backgroundImage = "";
    document.body.style.backgroundColor = "";
    return;
  }

  document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), url("${dataUrl}")`;
}

function loadWallpaper() {
  chrome.storage.local.get([WALLPAPER_KEY], (result) => {
    const saved = typeof result[WALLPAPER_KEY] === "string" ? result[WALLPAPER_KEY] : "";
    applyWallpaper(saved);
  });
}

function saveWallpaper(dataUrl) {
  applyWallpaper(dataUrl);

  chrome.storage.local.set({ [WALLPAPER_KEY]: dataUrl }, () => {
    if (chrome.runtime.lastError) {
      setStatus("Could not save wallpaper. Try a smaller image.", true);
    }
  });
}

function clearWallpaper() {
  applyWallpaper("");

  chrome.storage.local.set({ [WALLPAPER_KEY]: "" }, () => {
    if (chrome.runtime.lastError) {
      setStatus("Could not update wallpaper state.", true);
    }
  });
}

function optimizeWallpaperDataUrl(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== "string") {
      onDone("");
      return;
    }

    const img = new Image();
    img.onload = () => {
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;

      const scale = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        onDone(reader.result);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG drastically reduces storage size for wallpapers.
      const optimized = canvas.toDataURL("image/jpeg", 0.82);
      onDone(optimized || reader.result);
    };
    img.onerror = () => onDone(reader.result);
    img.src = reader.result;
  };
  reader.onerror = () => onDone("");
  reader.readAsDataURL(file);
}

function buildSearchUrl(app, query) {
  if (app.searchUrlTemplate.includes("{query}")) {
    return app.searchUrlTemplate.replaceAll("{query}", query);
  }
  return app.searchUrlTemplate;
}

function appFromTemplate(rawApp) {
  return {
    ...rawApp,
    buildUrl: (encodedQuery) => buildSearchUrl(rawApp, encodedQuery)
  };
}

function getAllApps() {
  const merged = [...DEFAULT_APPS, ...customApps];
  const map = new Map(merged.map((app) => [app.id, app]));

  const ordered = [];
  for (const id of appOrder) {
    const app = map.get(id);
    if (app) {
      ordered.push(app);
      map.delete(id);
    }
  }
  for (const app of map.values()) {
    ordered.push(app);
  }

  return ordered.filter((app) => !hiddenAppIds.has(app.id)).map(appFromTemplate);
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b00020" : "#2a4f80";
}

function openSingleApp(app, query) {
  const encodedQuery = encodeURIComponent(query.trim());
  const needsQuery = app.searchUrlTemplate.includes("{query}");

  if (needsQuery && !encodedQuery) {
    setStatus("Type your question first.", true);
    return;
  }

  window.location.href = app.buildUrl(encodedQuery);
}

function openDefaultSearch(query) {
  const encodedQuery = encodeURIComponent(query.trim());

  if (!encodedQuery) {
    setStatus("Type your question first.", true);
    return;
  }

  window.location.href = `https://www.google.com/search?q=${encodedQuery}`;
}

function renderApps() {
  appsGrid.innerHTML = "";
  for (const app of getAllApps()) {
    const wrapper = document.createElement("div");
    wrapper.className = "app-chip-wrap";
    wrapper.dataset.appId = app.id;
    wrapper.draggable = isManageMode;

    wrapper.addEventListener("dragstart", (event) => {
      if (!isManageMode) return;
      draggingAppId = app.id;
      wrapper.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", app.id);
    });

    wrapper.addEventListener("dragend", () => {
      draggingAppId = null;
      wrapper.classList.remove("dragging");
      renderApps();
    });

    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-chip";
    button.dataset.appId = app.id;
    button.setAttribute("aria-label", app.name);

    const faviconWrap = document.createElement("span");
    faviconWrap.className = "app-favicon-wrap";

    const favicon = document.createElement("img");
    favicon.className = "app-favicon";
    favicon.alt = "";
    favicon.src = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(app.domain)}`;
    favicon.loading = "lazy";

    const name = document.createElement("span");
    name.className = "app-name";
    name.textContent = app.name;

    const openIcon = document.createElement("span");
    openIcon.className = "app-open-icon";
    openIcon.textContent = "↗";
    openIcon.setAttribute("aria-hidden", "true");

    faviconWrap.appendChild(favicon);
    button.appendChild(faviconWrap);
    button.appendChild(name);
    button.appendChild(openIcon);

    button.addEventListener("click", () => {
      openSingleApp(app, queryInput.value);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "app-remove-btn";
    removeBtn.textContent = "-";
    removeBtn.setAttribute("aria-label", `Remove ${app.name}`);
    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      confirmAndRemoveApp(app);
    });

    wrapper.appendChild(button);
    wrapper.appendChild(removeBtn);
    appsGrid.appendChild(wrapper);
  }

  appsGrid.classList.toggle("manage-mode", isManageMode);
}

function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  const dayName = dayNames[now.getDay()];

  let timeGreeting = "Good evening";
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 17) timeGreeting = "Good afternoon";

  const lines = [
    `Happy ${dayName}, ${USER_NAME}`,
    `${timeGreeting}, ${USER_NAME}`,
    `${timeGreeting}, ${USER_NAME}. Let’s build something legendary.`,
    `Mission ready, ${USER_NAME}. Pick your engine.`
  ];

  // Rotate once per hour so greeting feels dynamic but stable.
  const index = (now.getDay() + hour) % lines.length;
  greetingEl.textContent = lines[index];
}

function renderCustomAppsList() {
  customAppsList.innerHTML = "";
  if (customApps.length === 0) {
    const empty = document.createElement("p");
    empty.className = "manage-hint";
    empty.textContent = "No custom apps yet.";
    customAppsList.appendChild(empty);
    return;
  }

  for (const app of customApps) {
    const row = document.createElement("div");
    row.className = "custom-app-row";

    const meta = document.createElement("div");
    meta.className = "custom-app-meta";

    const title = document.createElement("div");
    title.className = "custom-app-title";
    title.textContent = app.name;

    const url = document.createElement("div");
    url.className = "custom-app-url";
    url.textContent = app.searchUrlTemplate;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-app-btn";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteCustomApp(app.id));

    meta.appendChild(title);
    meta.appendChild(url);
    row.appendChild(meta);
    row.appendChild(del);
    customAppsList.appendChild(row);
  }
}

function getAppsForControls() {
  const merged = [...DEFAULT_APPS, ...customApps];
  const map = new Map(merged.map((app) => [app.id, app]));
  const ordered = [];

  for (const id of appOrder) {
    const app = map.get(id);
    if (app) {
      ordered.push(app);
      map.delete(id);
    }
  }
  for (const app of map.values()) {
    ordered.push(app);
  }
  return ordered;
}

function persistAppPrefs() {
  chrome.storage.sync.set({
    [APP_PREFS_KEY]: {
      order: appOrder,
      hidden: Array.from(hiddenAppIds)
    }
  });
}

appsGrid.addEventListener("dragover", (event) => {
  if (!draggingAppId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
});

appsGrid.addEventListener("drop", (event) => {
  event.preventDefault();
  if (!draggingAppId) return;

  const targetRow = event.target.closest(".app-chip-wrap");
  if (!targetRow) return;
  const targetAppId = targetRow.dataset.appId;
  if (!targetAppId || targetAppId === draggingAppId) return;

  reorderAppsByDrop(draggingAppId, targetAppId);
});

function reorderAppsByDrop(sourceAppId, targetAppId) {
  const ids = getAppsForControls().map((a) => a.id);
  const fromIndex = ids.indexOf(sourceAppId);
  const toIndex = ids.indexOf(targetAppId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

  const [moved] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, moved);
  appOrder = ids;
  persistAppPrefs();
  renderApps();
}

function confirmAndRemoveApp(app) {
  const message = app.builtIn
    ? `Remove ${app.name} from your app grid? You can show it again in Manage Apps.`
    : `Delete ${app.name} permanently from your custom apps?`;

  const ok = window.confirm(message);
  if (!ok) return;

  if (app.builtIn) {
    hiddenAppIds.add(app.id);
    persistAppPrefs();
    renderApps();
    return;
  }

  deleteCustomApp(app.id);
}

function persistCustomApps() {
  chrome.storage.sync.set({ [CUSTOM_APPS_KEY]: customApps });
}

function deleteCustomApp(appId) {
  customApps = customApps.filter((a) => a.id !== appId);
  appOrder = appOrder.filter((id) => id !== appId);
  hiddenAppIds.delete(appId);
  persistAppPrefs();
  persistCustomApps();
  renderApps();
  renderCustomAppsList();
  setStatus("");
}

function normalizeDomain(urlString) {
  try {
    return new URL(urlString).hostname;
  } catch (_) {
    return "";
  }
}

function deriveAppNameFromUrl(urlString) {
  try {
    const host = new URL(urlString).hostname.toLowerCase();
    const withoutWww = host.replace(/^www\./, "");
    const base = withoutWww.split(".")[0] || withoutWww;
    if (!base) return "Custom App";

    // Convert separators to spaces and title-case.
    const cleaned = base.replace(/[-_]+/g, " ").trim();
    if (!cleaned) return "Custom App";

    return cleaned
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch (_) {
    return "Custom App";
  }
}

async function detectWebsiteTitle(urlString) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(urlString, {
      method: "GET",
      signal: controller.signal
    });
    if (!response.ok) return "";

    const html = await response.text();
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match || !match[1]) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<title>${match[1]}</title>`, "text/html");
    const title = (doc.querySelector("title")?.textContent || "").trim();
    if (!title) return "";

    // Remove common separator tails: "Home - X", "X | Official".
    const simplified = title.split(" | ")[0].split(" - ")[0].trim();
    return simplified || title;
  } catch (_) {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function loadCustomApps() {
  chrome.storage.sync.get([CUSTOM_APPS_KEY, APP_PREFS_KEY], (result) => {
    const stored = result[CUSTOM_APPS_KEY];
    const prefs = result[APP_PREFS_KEY];
    customApps = Array.isArray(stored) ? stored : [];
    appOrder = Array.isArray(prefs?.order) ? prefs.order : [...DEFAULT_APPS.map((a) => a.id), ...customApps.map((a) => a.id)];
    hiddenAppIds = new Set(Array.isArray(prefs?.hidden) ? prefs.hidden : []);

    // Safety: if everything is hidden, restore defaults so the grid is never empty.
    const visibleApps = [...DEFAULT_APPS, ...customApps].filter((app) => !hiddenAppIds.has(app.id));
    if (visibleApps.length === 0) {
      hiddenAppIds = new Set();
      appOrder = [...DEFAULT_APPS.map((a) => a.id), ...customApps.map((a) => a.id)];
      persistAppPrefs();
    }

    renderApps();
    renderCustomAppsList();
  });
}

async function addCustomApp(name, searchUrlTemplate) {
  const trimmedName = name.trim();
  const trimmedTemplate = searchUrlTemplate.trim();

  if (!trimmedTemplate) {
    setStatus("App URL is required.", true);
    return;
  }
  if (!/^https?:\/\//i.test(trimmedTemplate)) {
    setStatus("URL must start with http:// or https://", true);
    return;
  }

  let finalName = trimmedName;
  if (!finalName) {
    const detected = await detectWebsiteTitle(trimmedTemplate);
    finalName = detected || deriveAppNameFromUrl(trimmedTemplate);
  }

  const customApp = {
    id: `custom-${Date.now()}`,
    name: finalName,
    domain: normalizeDomain(trimmedTemplate),
    searchUrlTemplate: trimmedTemplate,
    builtIn: false
  };
  customApps.push(customApp);
  appOrder.push(customApp.id);
  persistAppPrefs();
  persistCustomApps();
  renderApps();
  renderCustomAppsList();
  addAppForm.reset();
  setStatus("");
}

if (!alreadyInitialized) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    openDefaultSearch(queryInput.value);
  });

  toggleManageBtn.addEventListener("click", () => {
    managePanel.classList.toggle("hidden");
    isManageMode = !managePanel.classList.contains("hidden");
    renderApps();
  });

  document.addEventListener("click", (event) => {
    const clickedInsideManage = managePanel.contains(event.target);
    const clickedToggle = toggleManageBtn.contains(event.target);
    const clickedCustomizePanel = customizePanel.contains(event.target);
    const clickedCustomizeToggle = wallpaperPencilBtn.contains(event.target);
    if (isManageMode && !clickedInsideManage && !clickedToggle) {
      managePanel.classList.add("hidden");
      isManageMode = false;
      renderApps();
    }
    if (!clickedCustomizePanel && !clickedCustomizeToggle) {
      customizePanel.classList.add("hidden");
    }
  });

  wallpaperPencilBtn.addEventListener("click", () => {
    customizePanel.classList.toggle("hidden");
  });

  uploadWallpaperBtn.addEventListener("click", () => {
    wallpaperInput.click();
    customizePanel.classList.add("hidden");
  });

  removeWallpaperBtn.addEventListener("click", () => {
    clearWallpaper();
    customizePanel.classList.add("hidden");
  });

  wallpaperInput.addEventListener("change", () => {
    const file = wallpaperInput.files && wallpaperInput.files[0];
    if (!file) return;
    optimizeWallpaperDataUrl(file, (dataUrl) => {
      if (!dataUrl) {
        setStatus("Could not process wallpaper image.", true);
        return;
      }
      saveWallpaper(dataUrl);
    });
    wallpaperInput.value = "";
  });

  addAppForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addCustomApp(appNameInput.value, appUrlInput.value);
  });

  colorButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color || "blue";
      setColorTheme(color);
      saveColorTheme(color);
    });
  });

}

updateGreeting();
loadColorTheme();
loadWallpaper();
loadCustomApps();
setStatus("");
queryInput.focus();
