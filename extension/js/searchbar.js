let prefs = {};
let textArea;

window.addEventListener("load", () => {
  chrome.storage.local.get(["preferences"], (result) => {
    if (!result.preferences) {
      prefs = { currentEngine: "Google" };
      chrome.storage.local.set({ preferences: prefs });
    } else {
      prefs = result.preferences;
    }

    swapElements(
      document.getElementById("Google"),
      document.getElementById(prefs.currentEngine)
    );

    textArea = document.getElementById("autosizable");

    // Focus searchbar when user starts typing anywhere on the page
    document.addEventListener("keypress", (e) => {
      // Ignore if user is already typing in an input/textarea or pressing special keys
      if (
        !e.target.closest("input, textarea") &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        e.key.length === 1
      ) {
        textArea.focus();
        // Don't lose the first character they typed
        textArea.value = textArea.value == "" ? e.key : textArea.value + e.key;
        // Move cursor to end
        textArea.setSelectionRange(
          textArea.value.length,
          textArea.value.length
        );
        e.preventDefault();
      }
    });

    initializeSearch();
    initializeSearchEngines();
  });
});

function initializeSearch() {
  const textArea = document.getElementById("autosizable");

  // Dynamically adjust textarea height based on content
  textArea.addEventListener("input", () => {
    textArea.style.height = "22px";
    textArea.style.height = `${textArea.scrollHeight}px`;
  });

  textArea.addEventListener("keydown", executeSearch);
  document
    .querySelector(".search-icon")
    .addEventListener("click", executeSearch);
}

function setSearchEngine(engine) {
  const activeEngine = document.getElementById(prefs.currentEngine);
  const newEngine = document.getElementById(engine);
  prefs.currentEngine = engine;
  chrome.storage.local.set({ preferences: prefs });
  swapElements(activeEngine, newEngine);
  textArea.focus();
}

function executeSearch(e) {
  if (e.type === "click") {
    search(prefs.currentEngine, document.getElementById("autosizable").value);
  } else if (e.type === "keydown" && e.keyCode === 13) {
    e.preventDefault();
    search(prefs.currentEngine, e.target.value);
  }
}

function search(engine, query) {
  // If direct URL, navigate directly instead of searching
  if (isURL(query)) return (window.location.href = query);

  const searchUrls = {
    DuckDuckGo: "https://duckduckgo.com/?q=",
    Bing: "https://www.bing.com/search?q=",
    Google: "https://google.com/search?q=",
    YouTube: "https://www.youtube.com/results?search_query=",
    Archive: "https://archive.org/search?query=",
  };

  if (searchUrls[engine]) window.location.href = searchUrls[engine] + query;
}

// Basic URL format validation
function isURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Swap search engines from active to inactive
function swapElements(active, next) {
  document.getElementById("active-engine-name").innerHTML = prefs.currentEngine;
  active.classList.replace("active", "inactive");
  next.classList.replace("inactive", "active");

  const placeholder = document.createElement("div");
  active.parentNode.insertBefore(placeholder, active);
  next.parentNode.insertBefore(active, next.nextSibling);
  placeholder.parentNode.insertBefore(next, placeholder);
  placeholder.remove();
}

function initializeSearchEngines() {
  document
    .querySelectorAll("[data-engine]")
    .forEach((engine) =>
      engine.addEventListener("click", () =>
        setSearchEngine(engine.dataset.engine)
      )
    );
}
