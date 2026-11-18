const api = window.talkieBrowser;
const tabStrip = document.getElementById("tab-strip");
const address = document.getElementById("address");
const backButton = document.getElementById("back");
const forwardButton = document.getElementById("forward");
const reloadButton = document.getElementById("reload");
const statusText = document.getElementById("status-text");
const statusDot = document.getElementById("status-dot");
const toast = document.getElementById("toast");
let currentState = null;
let toastTimeout = null;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function renderTabs() {
  if (!currentState) return;
  tabStrip.querySelectorAll(".tab").forEach((node) => node.remove());

  const spacer = tabStrip.querySelector(".tab-strip-spacer");
  for (const tab of currentState.tabs) {
    const button = document.createElement("button");
    button.className = "tab" + (tab.id === currentState.activeTabId ? " active" : "");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(tab.id === currentState.activeTabId));
    button.title = tab.url || tab.title;

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.isLoading ? "Loading…" : tab.title || "New tab";

    const close = document.createElement("span");
    close.className = "tab-close";
    close.textContent = "×";
    close.setAttribute("role", "button");
    close.setAttribute("aria-label", "Close tab");
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      api.closeTab(tab.id);
    });

    button.append(title, close);
    button.addEventListener("click", () => api.switchTab(tab.id));
    tabStrip.insertBefore(button, spacer);
  }
}

function renderState(state) {
  if (!state) return;
  currentState = state;
  renderTabs();

  const active = state.active;
  backButton.disabled = !active || !active.canGoBack;
  forwardButton.disabled = !active || !active.canGoForward;
  reloadButton.textContent = active?.isLoading ? "×" : "↻";
  reloadButton.title = active?.isLoading ? "Stop loading" : "Reload";

  if (active && document.activeElement !== address) {
    address.value = active.url || "";
  }

  statusDot.classList.toggle("loading", Boolean(active?.isLoading));
  statusText.textContent = active?.isLoading
    ? "Loading page…"
    : active?.url
      ? (active.title || "Page ready")
      : "New tab — search or enter an address";
}

async function refresh() {
  try { renderState(await api.getState()); }
  catch (error) { notify(error.message || "Could not read browser state"); }
}

document.getElementById("new-tab").addEventListener("click", () => api.newTab(""));
backButton.addEventListener("click", () => api.back());
forwardButton.addEventListener("click", () => api.forward());
reloadButton.addEventListener("click", () => api.reload());
document.getElementById("home").addEventListener("click", () => api.home());

document.getElementById("address-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = address.value.trim();
  if (!value) return;
  try {
    await api.navigate(value);
    address.blur();
  } catch (error) {
    notify(error.message || "That address could not be opened");
  }
});

document.getElementById("ai-toggle").addEventListener("click", () => {
  notify("The AI workspace is planned, but it is not connected in this build yet.");
});
document.getElementById("menu").addEventListener("click", () => {
  notify("Bookmarks, downloads and settings are still being built.");
});

document.addEventListener("keydown", (event) => {
  const command = event.metaKey || event.ctrlKey;
  if (!command) return;

  const key = event.key.toLowerCase();
  if (key === "l") {
    event.preventDefault();
    address.focus();
    address.select();
  } else if (key === "t" && event.shiftKey) {
    event.preventDefault();
    notify("Recently closed tabs are not available yet.");
  } else if (key === "t") {
    event.preventDefault();
    api.newTab("");
  } else if (key === "w") {
    event.preventDefault();
    if (currentState?.activeTabId) api.closeTab(currentState.activeTabId);
  } else if (key === "r") {
    event.preventDefault();
    api.reload();
  }
});

api.onStateChange(renderState);
refresh();
