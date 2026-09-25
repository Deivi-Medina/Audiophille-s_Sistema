// assets/js/settings.js
import { getTheme, getMode, setTheme, setMode, getAvailableThemes, getCurrentThemeName } from "./theme.js";
import { showSection } from "./navigation.js";

let isOpen = false;

export function openSettings() {
  showSection("settings");
  renderSettings();
  isOpen = true;
}

export function closeSettings() {
  showSection("home");
  isOpen = false;
}

export function toggleSettings() {
  if (isOpen) {
    closeSettings();
  } else {
    openSettings();
  }
}

function renderSettings() {
  const container = document.getElementById("settingsView");
  if (!container) return;

  const currentTheme = getTheme();
  const currentMode = getMode();
  const themes = getAvailableThemes();

  container.innerHTML = `
        <div class="settings-container">
            <button class="back-btn" id="settingsBackBtn">
                <i data-lucide="arrow-left"></i> Volver
            </button>

            <h2 class="settings-title">Ajustes</h2>

            <div class="settings-section">
                <h3 class="settings-section-title">Apariencia</h3>
                <div class="settings-row">
                    <span>Modo Oscuro</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="settingsDarkModeToggle" ${currentMode === "dark" ? "checked" : ""}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="settings-row">
                    <span>Tema de color</span>
                    <div class="theme-selector">
                        ${themes
                          .map(
                            (theme) => `
                            <button class="theme-option ${theme.id === currentTheme ? "active" : ""}" 
                                    data-theme="${theme.id}" 
                                    style="--theme-color: ${theme.accent}; --theme-color-hover: ${theme.accentHover};"
                                    title="${theme.name}">
                                <span class="theme-color-preview" style="background: ${theme.accent};"></span>
                            </button>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
                <div class="settings-row">
                    <span class="theme-name-display">Tema actual: <strong>${getCurrentThemeName()}</strong></span>
                </div>
            </div>
        </div>
    `;

  const backBtn = document.getElementById("settingsBackBtn");
  if (backBtn) {
    backBtn.addEventListener("click", closeSettings);
  }

  const darkModeToggle = document.getElementById("settingsDarkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("change", function () {
      const mode = this.checked ? "dark" : "light";
      setMode(mode);
    });
  }

  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.addEventListener("click", function () {
      const themeId = this.dataset.theme;
      setTheme(themeId);
      document.querySelectorAll(".theme-option").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const nameDisplay = document.querySelector(".theme-name-display strong");
      if (nameDisplay) {
        const theme = getAvailableThemes().find((t) => t.id === themeId);
        nameDisplay.textContent = theme ? theme.name : "Morado";
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

export function initSettings() {
  const settingsView = document.createElement("main");
  settingsView.id = "settingsView";
  settingsView.className = "content-wrapper hidden";
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.appendChild(settingsView);
  }
}

export function getSettingsState() {
  return { isOpen };
}
