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
const THEME_KEY = "themeMode";
const APP_PREFS_KEY = "appPrefs";
const WALLPAPER_KEY = "customWallpaper";
const USER_NAME = "Srivatsav";
const DEFAULT_WALLPAPER_URL = "assets/default-wallpaper.png";

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
const lightThemeBtn = document.getElementById("theme-light");
const darkThemeBtn = document.getElementById("theme-dark");
const wallpaperPencilBtn = document.getElementById("wallpaper-pencil");
const customizePanel = document.getElementById("customize-panel");
const uploadWallpaperBtn = document.getElementById("upload-wallpaper");
const removeWallpaperBtn = document.getElementById("remove-wallpaper");
const wallpaperInput = document.getElementById("wallpaper-input");

let customApps = [];
let appOrder = [];
let hiddenAppIds = new Set();
let draggingAppId = null;
let isManageMode = false;

function setTheme(mode) {
  const theme = mode === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);
  lightThemeBtn.classList.toggle("active", theme === "light");
  darkThemeBtn.classList.toggle("active", theme === "dark");
}

function saveTheme(mode) {
  chrome.storage.sync.set({ [THEME_KEY]: mode });
}

function loadTheme() {
  chrome.storage.sync.get([THEME_KEY], (result) => {
    const savedTheme = result[THEME_KEY];
    setTheme(savedTheme === "light" ? "light" : "dark");
  });
}

function applyWallpaper(dataUrl) {
  if (!dataUrl) {
    document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.12)), url("${DEFAULT_WALLPAPER_URL}")`;
    document.body.style.backgroundColor = "";
    return;
  }

  document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.12)), url("${dataUrl}")`;
}

function loadWallpaper() {
  chrome.storage.local.get([WALLPAPER_KEY], (result) => {
    applyWallpaper(result[WALLPAPER_KEY] || "");
  });
}

function saveWallpaper(dataUrl) {
  chrome.storage.local.set({ [WALLPAPER_KEY]: dataUrl }, () => {
    applyWallpaper(dataUrl);
  });
}

function clearWallpaper() {
  chrome.storage.local.remove([WALLPAPER_KEY], () => {
    applyWallpaper("");
  });
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
  const hour = new Date().getHours();
  if (hour < 12) {
    greetingEl.textContent = `Good morning, ${USER_NAME}`;
    return;
  }
  if (hour < 17) {
    greetingEl.textContent = `Good afternoon, ${USER_NAME}`;
    return;
  }
  greetingEl.textContent = `Good evening, ${USER_NAME}`;
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

function addCustomApp(name, searchUrlTemplate) {
  const trimmedName = name.trim();
  const trimmedTemplate = searchUrlTemplate.trim();

  if (!trimmedName || !trimmedTemplate) {
    setStatus("App name and URL are required.", true);
    return;
  }
  if (!/^https?:\/\//i.test(trimmedTemplate)) {
    setStatus("URL must start with http:// or https://", true);
    return;
  }

  const customApp = {
    id: `custom-${Date.now()}`,
    name: trimmedName,
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
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      saveWallpaper(reader.result);
    }
  };
  reader.readAsDataURL(file);
  wallpaperInput.value = "";
});

addAppForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addCustomApp(appNameInput.value, appUrlInput.value);
});

lightThemeBtn.addEventListener("click", () => {
  setTheme("light");
  saveTheme("light");
});

darkThemeBtn.addEventListener("click", () => {
  setTheme("dark");
  saveTheme("dark");
});

updateGreeting();
loadTheme();
loadWallpaper();
loadCustomApps();
setStatus("");
queryInput.focus();
