import { getAchievements, updateXp, unlockAchievement } from "./services/achievementService.js";

let allAchievements = [];
let unlockedIds = [];
let xpTotal = 0;
let currentLevel = 1;
let niveles = [];
let achievementsLoaded = false;

export async function loadAchievements() {
  try {
    const data = await getAchievements();
    if (data.success) {
      allAchievements = data.achievements || [];
      unlockedIds = data.unlocked || [];
      xpTotal = data.xp_total || 0;
      currentLevel = data.nivel_actual || 1;
      niveles = data.niveles || [];
      achievementsLoaded = true;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error cargando logros:", error);
    return false;
  }
}

export function getAchievementData() {
  if (!achievementsLoaded) {
    return {
      achievements: [],
      unlockedCount: 0,
      total: 0,
      xp: 0,
      level: 1,
      levelName: "Novato",
      levelIcon: "🌱",
      progress: 0,
      nextLevel: null,
    };
  }

  const unlockedCount = allAchievements.filter((a) => a.desbloqueado).length;
  const total = allAchievements.length;

  const currentLevelData = niveles.find((n) => n.id_nivel === currentLevel) || { nombre: "Novato", icono: "🌱", xp_minimo: 0 };
  const nextLevel = niveles.find((n) => n.id_nivel === currentLevel + 1);

  let progress = 0;
  if (nextLevel) {
    const currentMin = currentLevelData.xp_minimo || 0;
    const nextMin = nextLevel.xp_minimo || currentMin + 1;
    progress = ((xpTotal - currentMin) / (nextMin - currentMin)) * 100;
    if (progress > 100) progress = 100;
  } else {
    progress = 100;
  }

  return {
    achievements: allAchievements,
    unlockedCount,
    total,
    xp: xpTotal,
    level: currentLevel,
    levelName: currentLevelData.nombre,
    levelIcon: currentLevelData.icono,
    progress,
    nextLevel,
  };
}

export function renderLevelInProfile() {
  const container = document.getElementById("profileLevelContainer");
  if (!container) return;

  const data = getAchievementData();

  container.innerHTML = `
        <div class="level-display">
            <div class="level-icon">${data.levelIcon}</div>
            <div class="level-info">
                <div class="level-name">Nivel ${data.level}: ${data.levelName}</div>
                <div class="level-xp">${data.xp} XP</div>
            </div>
            <div class="level-progress-container">
                <div class="level-progress-bar">
                    <div class="level-progress-fill" style="width: ${data.progress}%"></div>
                </div>
                <div class="level-progress-text">
                    ${data.nextLevel ? `${data.xp} / ${data.nextLevel.xp_minimo} XP` : "¡Nivel máximo!"}
                </div>
            </div>
        </div>
    `;
}

export function renderAchievementsInProfile() {
  const grid = document.getElementById("profileAchievementsGrid");
  if (!grid) return;

  const data = getAchievementData();

  if (data.achievements.length === 0) {
    grid.innerHTML = `<p class="empty-message">No hay logros disponibles.</p>`;
    return;
  }

  grid.innerHTML = "";

  data.achievements.forEach((ach) => {
    const isUnlocked = ach.desbloqueado === true || ach.desbloqueado === 1;
    const card = document.createElement("div");
    card.className = `achievement-card ${isUnlocked ? "unlocked" : "locked"}`;

    const rarezaClass = ach.rareza || "comun";
    card.dataset.rareza = rarezaClass;

    card.innerHTML = `
            <div class="achievement-card-icon">${ach.icono}</div>
            <div class="achievement-card-name">${ach.nombre}</div>
            <div class="achievement-card-desc">${ach.descripcion || ""}</div>
            <div class="achievement-card-rareza ${rarezaClass}">${rarezaClass}</div>
            <div class="achievement-card-status">${isUnlocked ? "✅ Desbloqueado" : "🔒 Bloqueado"}</div>
        `;

    grid.appendChild(card);
  });
}

function showToast(message, icon = "🎉", duration = 4000) {
  const existing = document.querySelector(".achievement-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "achievement-toast";
  toast.innerHTML = `
        <div class="achievement-toast-icon">${icon}</div>
        <div class="achievement-toast-message">${message}</div>
    `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

export function notifyAchievementUnlock(achievement) {
  if (!achievement) return;
  const icon = achievement.icono || "🏆";
  const message = `${achievement.nombre} desbloqueado! +${achievement.xp} XP`;
  showToast(message, icon, 5000);
}

export function notifyLevelUp(level, levelName, icon) {
  const message = `🎊 Subiste al nivel ${level}: ${levelName}`;
  showToast(message, icon || "👑", 6000);
}

export async function addXpForAction(actionType) {
  if (!achievementsLoaded) {
    await loadAchievements();
  }

  const xpMap = {
    play: 1,
    review: 5,
    playlist: 3,
    favorite: 2,
    game_win: 3,
    follow: 2,
    album: 5,
  };

  const xp = xpMap[actionType] || 0;
  if (xp === 0) return;

  try {
    const data = await updateXp(xp, actionType);
    if (data.success) {
      const newUnlocked = data.unlocked || [];
      const previousUnlocked = new Set(unlockedIds);
      const newAchievements = newUnlocked.filter((id) => !previousUnlocked.has(id));

      if (newAchievements.length > 0) {
        for (const id of newAchievements) {
          const ach = allAchievements.find((a) => a.id_logro === id);
          if (ach) {
            ach.desbloqueado = true;
            notifyAchievementUnlock(ach);
          }
        }
      }

      unlockedIds = newUnlocked;
      xpTotal = data.xp_total || xpTotal;
      const newLevel = data.nivel_actual || currentLevel;

      if (newLevel > currentLevel) {
        const levelData = niveles.find((n) => n.id_nivel === newLevel);
        if (levelData) {
          notifyLevelUp(newLevel, levelData.nombre, levelData.icono);
        }
      }

      currentLevel = newLevel;
      renderLevelInProfile();
      renderAchievementsInProfile();
    }
  } catch (error) {
    console.error("Error al actualizar XP:", error);
  }
}

export async function initAchievements() {
  await loadAchievements();
  renderLevelInProfile();
  renderAchievementsInProfile();

  const profileObserver = new MutationObserver(() => {
    if (document.getElementById("profileView") && !document.getElementById("profileView").classList.contains("hidden")) {
      renderLevelInProfile();
      renderAchievementsInProfile();
    }
  });

  const profileView = document.getElementById("profileView");
  if (profileView) {
    profileObserver.observe(profileView, { attributes: true, attributeFilter: ["class"] });
  }

  return {
    reload: async () => {
      await loadAchievements();
      renderLevelInProfile();
      renderAchievementsInProfile();
    },
  };
}

export function getUnlockedCount() {
  return unlockedIds.length;
}
