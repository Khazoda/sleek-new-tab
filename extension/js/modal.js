class ModalController {
  constructor() {
    this.modal = document.getElementById("settings-modal");
    this.backdrop = document.getElementById("modal-backdrop");
    this.button = document.getElementById("settings-button");
    this.form = this.modal.querySelector("form");
    this.shortcuts = {};

    this.toggleIDs = ["scale_up_shortcuts_toggle"];

    // Initialize event listeners
    this.button.addEventListener("click", () => this.open());
    this.backdrop.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
    this.modal
      .querySelector(".modal-close")
      .addEventListener("click", () => this.close());

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveShortcutsToStorage(e);
    });

    // Initialize toggle listeners and load saved states
    this.toggleIDs.forEach((id) => {
      const toggle = document.getElementById(id);
      toggle.addEventListener("change", () => this.saveToggleStates());
    });

    document
      .querySelectorAll('input[name="clock_position"]')
      .forEach((radio) => {
        radio.addEventListener("change", (e) => {
          const position = e.target.value;
          this.saveClockPosition(position);
        });
      });

    // Load initial clock position
    chrome.storage.local.get(["clock_position"], (result) => {
      const savedPosition = result.clock_position || "bottom-left";
      this.updateClockPosition(savedPosition);

      // Set the initial radio button state for clock location
      const radioButton = document.querySelector(
        `input[name="clock_position"][value="${savedPosition}"]`
      );
      if (radioButton) {
        radioButton.checked = true;
      }
    });

    // Initial load of saved data
    this.loadFromStorage();

    // Add click handlers for shortcut links
    document.querySelectorAll("a.shortcut-link").forEach((link, index) => {
      link.addEventListener("click", (e) => {
        const shortcutKey = `shortcut_${index + 1}`;
        if (!this.shortcuts[shortcutKey]) {
          e.preventDefault();
          this.open();
          // Focus the corresponding input field
          setTimeout(() => {
            document.getElementById(`shortcut${index + 1}`).focus();
          }, 100);
        }
      });
    });
  }

  loadFromStorage() {
    // Load shortcuts
    const savedShortcuts = chrome.storage.local.get(["shortcuts"], (result) => {
      if (result.shortcuts) {
        this.shortcuts = result.shortcuts;
      } else {
        this.shortcuts = {
          shortcut_1: "",
          shortcut_2: "",
          shortcut_3: "https://wikipedia.org/wiki/Special:Random",
        };
        chrome.storage.local.set({ shortcuts: this.shortcuts });
      }
      this.refreshShortcutURLs();
      this.refreshShortcutIcons();
    });

    // Load toggle states
    this.toggleIDs.forEach((id) => {
      chrome.storage.local.get([id], (result) => {
        const toggle = document.getElementById(id);
        if (id === "scale_up_shortcuts_toggle") {
          toggle.checked = result[id] === true;
        } else {
          // Other toggle states
        }
        this.updateToggleVisibility(id, toggle.checked);
      });
    });
  }

  refreshShortcutURLs() {
    const shortcutLinks = document.querySelectorAll("a.shortcut-link");
    shortcutLinks.forEach((link, index) => {
      const shortcutKey = `shortcut_${index + 1}`;
      if (this.shortcuts[shortcutKey]) {
        link.href = this.shortcuts[shortcutKey];
      }
    });
  }

  refreshShortcutIcons() {
    document.querySelectorAll(".shortcut-img").forEach((element) => {
      for (let i = 1; i <= 3; i++) {
        if (element.classList.contains(`shortcut-img-${i}`)) {
          const shortcutKey = `shortcut_${i}`;
          const url = this.shortcuts[shortcutKey];

          if (!url) {
            element.src = "./assets/img/empty_shortcut.svg";
            document.getElementById(`shortcut${i}`).placeholder = "example.com";
            continue;
          }

          const trimmedURL = url.replace(/^https?:\/\//, "").split("/")[0];
          element.src = `https://www.faviconextractor.com/favicon/${trimmedURL}?larger=true`;
          document.getElementById(`shortcut${i}`).placeholder = url;
        }
      }
    });
  }

  async saveShortcutsToStorage(event) {
    event.preventDefault();
    this.activateSubmitButton();

    const newShortcuts = { ...this.shortcuts };
    const shortcutPromises = [1, 2, 3].map((i) => {
      const input = document.getElementById(`shortcut${i}`);
      const inputWrapper = input.closest(".input-wrapper");
      const value = input.value.trim();

      if (value === "") {
        // Don't modify the shortcut if field is empty
        return Promise.resolve();
      }

      if (!this.isValidUrlFormat(value)) {
        input.value = "";
        this.shakeElement(inputWrapper);
        return Promise.reject();
      }

      const normalizedUrl = this.normalizeUrl(value);
      newShortcuts[`shortcut_${i}`] = normalizedUrl;
      input.value = "";
      return Promise.resolve();
    });

    try {
      await Promise.all(shortcutPromises);
      this.shortcuts = newShortcuts;
      chrome.storage.local.set({ shortcuts: this.shortcuts });
      this.refreshShortcutURLs();
      this.refreshShortcutIcons();
    } catch {
      // If any validation failed, don't save
    }
  }

  saveToggleStates() {
    this.toggleIDs.forEach((id) => {
      const toggle = document.getElementById(id);
      chrome.storage.local.set({ [id]: toggle.checked });
      this.updateToggleVisibility(id, toggle.checked);
    });
  }

  updateToggleVisibility(id, isVisible) {
    switch (id) {
      case "scale_up_shortcuts_toggle":
        this.toggleShortcutScale(isVisible);
        break;
    }
  }

  toggleVisibility(elementId, isVisible) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = isVisible ? "" : "none";
      element.dataset.visible = isVisible.toString();
    }
  }

  toggleShortcutScale(scaleUp) {
    document.querySelectorAll(".shortcut-img").forEach((img) => {
      if (scaleUp) {
        img.classList.add("scale-up");
      } else {
        img.classList.remove("scale-up");
      }
    });
  }

  normalizeUrl(url) {
    if (!url) return "";
    url = url.trim();
    // Handle URLs that start with www.
    if (url.startsWith("www.")) {
      return "https://" + url;
    }
    // Add https:// if no protocol is specified
    if (!url.match(/^https?:\/\//i)) {
      return "https://" + url;
    }
    return url;
  }

  isValidUrlFormat(url) {
    if (!url) return false;
    try {
      // First try parsing as-is
      const urlWithProtocol = url.match(/^https?:\/\//i)
        ? url
        : "https://" + url;
      const parsedUrl = new URL(urlWithProtocol);
      // Check for valid domain format (at least one dot)
      if (!parsedUrl.hostname.includes(".")) {
        return false;
      }
      // Check for common TLDs or at least two parts in domain
      const parts = parsedUrl.hostname.split(".");
      if (parts.length < 2 || parts.some((part) => !part)) {
        return false;
      }
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }

  shakeElement(element) {
    if (!element) return;
    element.classList.add("shake");
    element.style.backgroundColor = "#ffe5e9";
    setTimeout(() => {
      element.classList.remove("shake");
      element.style.backgroundColor = "";
    }, 500);
  }

  activateSubmitButton() {
    const submitButton = this.form.querySelector('button[type="submit"]');
    submitButton.classList.add("active");
    setTimeout(() => submitButton.classList.remove("active"), 200);
  }

  open() {
    this.modal.classList.remove("hidden");
    this.backdrop.classList.remove("hidden");
  }

  close() {
    this.modal.classList.add("hidden");
    this.backdrop.classList.add("hidden");
  }

  saveClockPosition(position) {
    chrome.storage.local.set({ clock_position: position });
    this.updateClockPosition(position);
  }

  updateClockPosition(position) {
    const clock = document.getElementById("time-display");
    if (!clock) {
      console.error("Clock element not found");
      return;
    }
    clock.classList.remove(
      "clock-top-left",
      "clock-top-right",
      "clock-bottom-left",
      "clock-bottom-right",
      "clock-disabled"
    );
    // Add the new position class after removing all position classes
    const clockClass = `clock-${position}`;
    clock.classList.add(clockClass);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ModalController();
});
