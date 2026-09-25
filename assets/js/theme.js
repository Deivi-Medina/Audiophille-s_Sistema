// assets/js/theme.js
const THEMES = {
  purple: {
    name: "Morado",
    light: {
      accent: "#6d28d9",
      accentHover: "#7c3aed",
      bgPrimary: "#ffffff", // Blanco puro estilo YouTube
      bgSecondary: "#f8f7fa", // Gris sutil para sidebars/paneles
      bgCard: "rgba(255, 255, 255, 0.8)",
      bgHover: "rgba(109, 40, 217, 0.06)",
      textPrimary: "#0d0b12",
      textSecondary: "#4a4458",
      textMuted: "#7a728a",
      border: "rgba(0, 0, 0, 0.06)", // Bordes limpios en lugar de blancos opacos
      shadow: "rgba(142, 131, 166, 0.06)",
      inputBg: "rgba(0, 0, 0, 0.02)",
      inputBorder: "rgba(109, 40, 217, 0.12)",
      hoverBg: "rgba(109, 40, 217, 0.08)",
      hoverBorder: "rgba(109, 40, 217, 0.25)",
      focusBorder: "rgba(109, 40, 217, 0.4)",
      cardShadow: "0 4px 20px rgba(142, 131, 166, 0.08)",
      cardHoverShadow: "0 8px 30px rgba(142, 131, 166, 0.16)",
      btnText: "#ffffff",
      btnHoverBg: "#7c3aed",
      btnActiveBg: "#5b21b6",
    },
    dark: {
      accent: "#9d4edd",
      accentHover: "#b072f5",
      bgPrimary: "#07040a",
      bgSecondary: "#0f0b14",
      bgCard: "rgba(25, 20, 38, 0.45)",
      bgHover: "rgba(255, 255, 255, 0.07)",
      textPrimary: "#f3f0fa",
      textSecondary: "#a39cb5",
      textMuted: "#665a75",
      border: "rgba(255, 255, 255, 0.06)",
      shadow: "rgba(0, 0, 0, 0.4)",
      inputBg: "rgba(0, 0, 0, 0.2)",
      inputBorder: "rgba(255, 255, 255, 0.08)",
      hoverBg: "rgba(157, 78, 221, 0.15)",
      hoverBorder: "rgba(157, 78, 221, 0.3)",
      focusBorder: "rgba(157, 78, 221, 0.5)",
      cardShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      cardHoverShadow: "0 8px 30px rgba(157, 78, 221, 0.15)",
      btnText: "#ffffff",
      btnHoverBg: "#b072f5",
      btnActiveBg: "#7c3aed",
    },
  },
  blue: {
    name: "Azul",
    light: {
      accent: "#2563eb",
      accentHover: "#3b82f6",
      bgPrimary: "#ffffff",
      bgSecondary: "#f8fafc",
      bgCard: "rgba(255, 255, 255, 0.8)",
      bgHover: "rgba(37, 99, 235, 0.06)",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#748296",
      border: "rgba(0, 0, 0, 0.06)",
      shadow: "rgba(148, 163, 184, 0.06)",
      inputBg: "rgba(0, 0, 0, 0.02)",
      inputBorder: "rgba(37, 99, 235, 0.12)",
      hoverBg: "rgba(37, 99, 235, 0.08)",
      hoverBorder: "rgba(37, 99, 235, 0.25)",
      focusBorder: "rgba(37, 99, 235, 0.4)",
      cardShadow: "0 4px 20px rgba(148, 163, 184, 0.08)",
      cardHoverShadow: "0 8px 30px rgba(37, 99, 235, 0.12)",
      btnText: "#ffffff",
      btnHoverBg: "#3b82f6",
      btnActiveBg: "#1d4ed8",
    },
    dark: {
      accent: "#3b82f6",
      accentHover: "#60a5fa",
      bgPrimary: "#040811",
      bgSecondary: "#0b111e",
      bgCard: "rgba(15, 23, 42, 0.45)",
      bgHover: "rgba(255, 255, 255, 0.07)",
      textPrimary: "#f1f5f9",
      textSecondary: "#94a3b8",
      textMuted: "#5a6e85",
      border: "rgba(255, 255, 255, 0.04)",
      shadow: "rgba(0, 0, 0, 0.4)",
      inputBg: "rgba(0, 0, 0, 0.2)",
      inputBorder: "rgba(255, 255, 255, 0.08)",
      hoverBg: "rgba(59, 130, 246, 0.15)",
      hoverBorder: "rgba(59, 130, 246, 0.3)",
      focusBorder: "rgba(59, 130, 246, 0.5)",
      cardShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      cardHoverShadow: "0 8px 30px rgba(59, 130, 246, 0.15)",
      btnText: "#ffffff",
      btnHoverBg: "#60a5fa",
      btnActiveBg: "#2563eb",
    },
  },
  green: {
    name: "Verde",
    light: {
      accent: "#059669",
      accentHover: "#10b981",
      bgPrimary: "#ffffff",
      bgSecondary: "#f4fbf7",
      bgCard: "rgba(255, 255, 255, 0.8)",
      bgHover: "rgba(5, 150, 105, 0.06)",
      textPrimary: "#061810",
      textSecondary: "#334139",
      textMuted: "#627d6f",
      border: "rgba(0, 0, 0, 0.06)",
      shadow: "rgba(98, 125, 111, 0.06)",
      inputBg: "rgba(0, 0, 0, 0.02)",
      inputBorder: "rgba(5, 150, 105, 0.12)",
      hoverBg: "rgba(5, 150, 105, 0.08)",
      hoverBorder: "rgba(5, 150, 105, 0.25)",
      focusBorder: "rgba(5, 150, 105, 0.4)",
      cardShadow: "0 4px 20px rgba(98, 125, 111, 0.08)",
      cardHoverShadow: "0 8px 30px rgba(5, 150, 105, 0.12)",
      btnText: "#ffffff",
      btnHoverBg: "#10b981",
      btnActiveBg: "#047857",
    },
    dark: {
      accent: "#10b981",
      accentHover: "#34d399",
      bgPrimary: "#030a06",
      bgSecondary: "#0a140f",
      bgCard: "rgba(10, 20, 15, 0.45)",
      bgHover: "rgba(255, 255, 255, 0.07)",
      textPrimary: "#edf7f2",
      textSecondary: "#99bfae",
      textMuted: "#547365",
      border: "rgba(255, 255, 255, 0.04)",
      shadow: "rgba(0, 0, 0, 0.4)",
      inputBg: "rgba(0, 0, 0, 0.2)",
      inputBorder: "rgba(255, 255, 255, 0.08)",
      hoverBg: "rgba(16, 185, 129, 0.15)",
      hoverBorder: "rgba(16, 185, 129, 0.3)",
      focusBorder: "rgba(16, 185, 129, 0.5)",
      cardShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      cardHoverShadow: "0 8px 30px rgba(16, 185, 129, 0.15)",
      btnText: "#ffffff",
      btnHoverBg: "#34d399",
      btnActiveBg: "#059669",
    },
  },
  orange: {
    name: "Naranja",
    light: {
      accent: "#ea580c",
      accentHover: "#f97316",
      bgPrimary: "#ffffff",
      bgSecondary: "#fdf8f5",
      bgCard: "rgba(255, 255, 255, 0.8)",
      bgHover: "rgba(234, 88, 12, 0.06)",
      textPrimary: "#1c0f05",
      textSecondary: "#443327",
      textMuted: "#857061",
      border: "rgba(0, 0, 0, 0.06)",
      shadow: "rgba(133, 112, 97, 0.06)",
      inputBg: "rgba(0, 0, 0, 0.02)",
      inputBorder: "rgba(234, 88, 12, 0.12)",
      hoverBg: "rgba(234, 88, 12, 0.08)",
      hoverBorder: "rgba(234, 88, 12, 0.25)",
      focusBorder: "rgba(234, 88, 12, 0.4)",
      cardShadow: "0 4px 20px rgba(133, 112, 97, 0.08)",
      cardHoverShadow: "0 8px 30px rgba(234, 88, 12, 0.12)",
      btnText: "#ffffff",
      btnHoverBg: "#f97316",
      btnActiveBg: "#c2410c",
    },
    dark: {
      accent: "#f59e0b",
      accentHover: "#fbbf24",
      bgPrimary: "#0a0703",
      bgSecondary: "#140e0a",
      bgCard: "rgba(20, 14, 10, 0.45)",
      bgHover: "rgba(255, 255, 255, 0.07)",
      textPrimary: "#fbf7f2",
      textSecondary: "#bf9f8a",
      textMuted: "#735c4f",
      border: "rgba(255, 255, 255, 0.04)",
      shadow: "rgba(0, 0, 0, 0.4)",
      inputBg: "rgba(0, 0, 0, 0.2)",
      inputBorder: "rgba(255, 255, 255, 0.08)",
      hoverBg: "rgba(245, 158, 11, 0.15)",
      hoverBorder: "rgba(245, 158, 11, 0.3)",
      focusBorder: "rgba(245, 158, 11, 0.5)",
      cardShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      cardHoverShadow: "0 8px 30px rgba(245, 158, 11, 0.15)",
      btnText: "#ffffff",
      btnHoverBg: "#fbbf24",
      btnActiveBg: "#ea580c",
    },
  },
  pink: {
    name: "Rosa",
    light: {
      accent: "#db2777",
      accentHover: "#ec4899",
      bgPrimary: "#ffffff",
      bgSecondary: "#fdf4f7",
      bgCard: "rgba(255, 255, 255, 0.8)",
      bgHover: "rgba(219, 39, 119, 0.06)",
      textPrimary: "#1c0510",
      textSecondary: "#442735",
      textMuted: "#856172",
      border: "rgba(0, 0, 0, 0.06)",
      shadow: "rgba(133, 97, 114, 0.06)",
      inputBg: "rgba(0, 0, 0, 0.02)",
      inputBorder: "rgba(219, 39, 119, 0.12)",
      hoverBg: "rgba(219, 39, 119, 0.08)",
      hoverBorder: "rgba(219, 39, 119, 0.25)",
      focusBorder: "rgba(219, 39, 119, 0.4)",
      cardShadow: "0 4px 20px rgba(133, 97, 114, 0.08)",
      cardHoverShadow: "0 8px 30px rgba(219, 39, 119, 0.12)",
      btnText: "#ffffff",
      btnHoverBg: "#ec4899",
      btnActiveBg: "#be185d",
    },
    dark: {
      accent: "#ec4899",
      accentHover: "#f472b6",
      bgPrimary: "#0a0306",
      bgSecondary: "#140a0e",
      bgCard: "rgba(20, 10, 14, 0.45)",
      bgHover: "rgba(255, 255, 255, 0.07)",
      textPrimary: "#fbf2f5",
      textSecondary: "#bf8aaf",
      textMuted: "#734f63",
      border: "rgba(255, 255, 255, 0.04)",
      shadow: "rgba(0, 0, 0, 0.4)",
      inputBg: "rgba(0, 0, 0, 0.2)",
      inputBorder: "rgba(255, 255, 255, 0.08)",
      hoverBg: "rgba(236, 72, 153, 0.15)",
      hoverBorder: "rgba(236, 72, 153, 0.3)",
      focusBorder: "rgba(236, 72, 153, 0.5)",
      cardShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      cardHoverShadow: "0 8px 30px rgba(236, 72, 153, 0.15)",
      btnText: "#ffffff",
      btnHoverBg: "#f472b6",
      btnActiveBg: "#db2777",
    },
  },
};
const DEFAULT_THEME = "purple";
const DEFAULT_MODE = "auto";

export function getTheme() {
  return localStorage.getItem("theme_color") || DEFAULT_THEME;
}

export function getMode() {
  return localStorage.getItem("theme_mode") || DEFAULT_MODE;
}

export function getResolvedMode() {
  const mode = getMode();
  if (mode === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export function setTheme(themeId) {
  if (!THEMES[themeId]) return;
  localStorage.setItem("theme_color", themeId);
  applyTheme(themeId, getMode());
}

export function setMode(mode) {
  localStorage.setItem("theme_mode", mode);
  applyTheme(getTheme(), mode);
}

export function toggleMode() {
  const current = getMode();
  let next = "auto";

  if (current === "auto") next = "light";
  else if (current === "light") next = "dark";
  else next = "auto";

  setMode(next);
  return next;
}

export function applyTheme(themeId, mode) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const resolvedMode = mode === "auto" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;

  const colors = resolvedMode === "light" ? theme.light : theme.dark;
  const root = document.documentElement;

  // --- Establecer todas las variables CSS ---
  // Colores base
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-hover", colors.accentHover);
  root.style.setProperty("--bg-primary", colors.bgPrimary);
  root.style.setProperty("--bg-secondary", colors.bgSecondary);
  root.style.setProperty("--bg-card", colors.bgCard);
  root.style.setProperty("--bg-hover", colors.bgHover);
  root.style.setProperty("--text-primary", colors.textPrimary);
  root.style.setProperty("--text-secondary", colors.textSecondary);
  root.style.setProperty("--text-muted", colors.textMuted);
  root.style.setProperty("--glass-border", colors.border);
  root.style.setProperty("--shadow-color", colors.shadow);
  root.style.setProperty("--input-bg", colors.inputBg);
  root.style.setProperty("--input-border", colors.inputBorder);

  // Nuevas variables para hover, focus, etc.
  root.style.setProperty("--hover-bg", colors.hoverBg);
  root.style.setProperty("--hover-border", colors.hoverBorder);
  root.style.setProperty("--focus-border", colors.focusBorder);
  root.style.setProperty("--card-shadow", colors.cardShadow);
  root.style.setProperty("--card-hover-shadow", colors.cardHoverShadow);
  root.style.setProperty("--btn-text", colors.btnText);
  root.style.setProperty("--btn-hover-bg", colors.btnHoverBg);
  root.style.setProperty("--btn-active-bg", colors.btnActiveBg);

  // Atributos del DOM para CSS adicional
  root.setAttribute("data-theme-color", themeId);
  root.setAttribute("data-theme-mode", mode);
  root.setAttribute("data-resolved-mode", resolvedMode);

  // Actualizar el fondo del mesh
  const meshBg = document.querySelector(".mesh-background");
  if (meshBg) {
    if (resolvedMode === "light") {
      meshBg.style.background = `radial-gradient(at 0% 0%, ${colors.bgSecondary} 0px, transparent 50%), radial-gradient(at 100% 100%, ${colors.bgPrimary} 0px, transparent 50%)`;
    } else {
      meshBg.style.background = colors.bgPrimary;
    }
  }

  // Forzar actualización de componentes (opcional)
  document
    .querySelectorAll(".album-card, .playlist-card, .review-item, .feed-item, .stat-card, .modal-content, .settings-section")
    .forEach((el) => {
      el.style.backgroundColor = "var(--bg-card)";
      el.style.borderColor = "var(--glass-border)";
    });

  document.querySelectorAll("input, select, textarea").forEach((el) => {
    el.style.backgroundColor = "var(--input-bg)";
    el.style.color = "var(--text-primary)";
    el.style.borderColor = "var(--input-border)";
  });
}

export function getAvailableThemes() {
  return Object.keys(THEMES).map((key) => ({
    id: key,
    name: THEMES[key].name,
    accent: THEMES[key].dark.accent,
    accentHover: THEMES[key].dark.accentHover,
  }));
}

export function getCurrentThemeName() {
  const themeId = getTheme();
  return THEMES[themeId]?.name || THEMES[DEFAULT_THEME].name;
}

export function handleModeButtonUpdate(buttonElement, mode) {
  if (!buttonElement) return;
  const labels = {
    auto: "🌓 Predeterminado",
    light: "☀️ Modo Claro",
    dark: "🌙 Modo Oscuro",
  };
  buttonElement.innerHTML = labels[mode] || labels["auto"];
}

export function initTheme(buttonSelector = null) {
  const theme = getTheme();
  const mode = getMode();
  applyTheme(theme, mode);

  if (buttonSelector) {
    const modeBtn = document.querySelector(buttonSelector);
    if (modeBtn) {
      handleModeButtonUpdate(modeBtn, mode);
      modeBtn.addEventListener("click", () => {
        const nextMode = toggleMode();
        handleModeButtonUpdate(modeBtn, nextMode);
      });
    }
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getMode() === "auto") {
      applyTheme(getTheme(), "auto");
    }
  });
}
