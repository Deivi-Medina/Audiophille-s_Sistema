// assets/js/community.js
import { loadFeed, setupFeedInfiniteScroll, filterFeed } from "./social/feed.js";
import {
  loadExploreUsers,
  setupExploreInfiniteScroll,
  searchExploreUsers,
  filterExploreUsers,
  clearExploreSearch,
} from "./social/explore.js";
import { getFollowers, getFollowing } from "./social/follow.js";
import { openPublicProfile } from "./social/profiles.js"; // Importar directamente

// ============================================================
// INICIALIZACIÓN DE PESTAÑAS
// ============================================================
export function initCommunityTabs() {
  // ===== PESTAÑAS PRINCIPALES =====
  document.querySelectorAll(".community-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".community-tab").forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      const tabName = this.dataset.tab;

      document.querySelectorAll(".community-tab-panel").forEach((p) => {
        p.classList.remove("active");
        p.classList.add("hidden");
      });
      const target = document.getElementById("tab-" + tabName);
      if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
      }

      switch (tabName) {
        case "feed":
          loadFeed(true);
          setTimeout(setupFeedInfiniteScroll, 300);
          break;
        case "explore":
          loadExploreUsers(true);
          setTimeout(setupExploreInfiniteScroll, 300);
          break;
        case "followers":
          loadFollowersList();
          break;
        case "following":
          loadFollowingList();
          break;
      }
    });
  });

  // ===== FILTROS DEL FEED =====
  document.querySelectorAll(".feed-filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".feed-filter-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      filterFeed(this.dataset.filter);
    });
  });

  // ===== REFRESCAR FEED =====
  document.getElementById("feedRefreshBtn")?.addEventListener("click", () => {
    loadFeed(true);
    setTimeout(setupFeedInfiniteScroll, 300);
  });

  // ===== BÚSQUEDA EN EXPLORAR =====
  const searchInput = document.getElementById("exploreSearchInput");
  if (searchInput) {
    let timeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const term = searchInput.value.trim();
        document.getElementById("exploreSearchClear")?.classList.toggle("hidden", !term);
        searchExploreUsers(term);
      }, 300);
    });
  }

  document.getElementById("exploreSearchClear")?.addEventListener("click", () => {
    const input = document.getElementById("exploreSearchInput");
    if (input) {
      input.value = "";
      document.getElementById("exploreSearchClear")?.classList.add("hidden");
      clearExploreSearch();
    }
  });

  // ===== FILTROS DE EXPLORAR =====
  document.querySelectorAll(".explore-filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".explore-filter-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      filterExploreUsers(this.dataset.filter);
    });
  });

  // ===== CARGAR CONTADORES DE SEGUIDORES/SIGUIENDO =====
  loadCounts();
}

// ============================================================
// CARGAR LISTA DE SEGUIDORES
// ============================================================
async function loadFollowersList() {
  const container = document.getElementById("followersList");
  if (!container) {
    console.warn("⚠️ followersList no encontrado");
    return;
  }

  container.innerHTML = `
    <div class="explore-loading">
      <div class="loading-spinner"></div>
      <p>Cargando seguidores...</p>
    </div>
  `;

  try {
    const data = await getFollowers(window.userId);
    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="feed-empty">
          <p>No tienes seguidores todavía</p>
          <p style="font-size:0.8rem; color:var(--text-secondary);">Comparte tu perfil para que te sigan</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    data.forEach((user) => {
      const card = document.createElement("div");
      card.className = "follower-card";
      const avatar = user.avatar
        ? `${window.baseUrl}${user.avatar}`
        : `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(user.nombre_usuario || "Usuario")}`;
      card.innerHTML = `
        <img src="${avatar}" class="user-avatar" onclick="window.openPublicProfile(${user.id_usuario})" style="cursor:pointer;">
        <div class="user-name" onclick="window.openPublicProfile(${user.id_usuario})" style="cursor:pointer;">${escapeHtml(user.nombre_usuario)}</div>
        <div class="user-username">@${escapeHtml(user.nombre_usuario)}</div>
        <div class="user-followers" style="font-size:0.75rem;color:var(--text-secondary);">
          Siguiendo desde ${new Date(user.fecha_seguimiento).toLocaleDateString()}
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error cargando seguidores:", error);
    container.innerHTML = `<div class="feed-error">❌ Error al cargar seguidores</div>`;
  }
}

// ============================================================
// CARGAR LISTA DE SIGUIENDO
// ============================================================
async function loadFollowingList() {
  const container = document.getElementById("followingList");
  if (!container) {
    console.warn("⚠️ followingList no encontrado");
    return;
  }

  container.innerHTML = `
    <div class="explore-loading">
      <div class="loading-spinner"></div>
      <p>Cargando seguidos...</p>
    </div>
  `;

  try {
    const data = await getFollowing(window.userId);
    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="feed-empty">
          <p>No sigues a nadie todavía</p>
          <button class="btn-primary" onclick="document.querySelector('[data-tab=\\'explore\\']')?.click()">
            <i data-lucide="compass"></i> Explorar usuarios
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = "";
    data.forEach((user) => {
      const card = document.createElement("div");
      card.className = "following-card";
      const avatar = user.avatar
        ? `${window.baseUrl}${user.avatar}`
        : `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(user.nombre_usuario || "Usuario")}`;
      card.innerHTML = `
        <img src="${avatar}" class="user-avatar" onclick="window.openPublicProfile(${user.id_usuario})" style="cursor:pointer;">
        <div class="user-name" onclick="window.openPublicProfile(${user.id_usuario})" style="cursor:pointer;">${escapeHtml(user.nombre_usuario)}</div>
        <div class="user-username">@${escapeHtml(user.nombre_usuario)}</div>
        <div class="user-followers" style="font-size:0.75rem;color:var(--text-secondary);">
          Siguiendo desde ${new Date(user.fecha_seguimiento).toLocaleDateString()}
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error cargando seguidos:", error);
    container.innerHTML = `<div class="feed-error">❌ Error al cargar seguidos</div>`;
  }
}

// ============================================================
// CARGAR CONTADORES EN LAS PESTAÑAS
// ============================================================
async function loadCounts() {
  try {
    const [followersData, followingData] = await Promise.all([getFollowers(window.userId), getFollowing(window.userId)]);

    const followersTab = document.querySelector('.community-tab[data-tab="followers"]');
    const followingTab = document.querySelector('.community-tab[data-tab="following"]');

    if (followersTab) {
      const count = followersData ? followersData.length : 0;
      followersTab.innerHTML = `<i data-lucide="users"></i> Seguidores (${count})`;
    }
    if (followingTab) {
      const count = followingData ? followingData.length : 0;
      followingTab.innerHTML = `<i data-lucide="user-check"></i> Siguiendo (${count})`;
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.warn("Error cargando contadores:", e);
  }
}

// ============================================================
// UTILIDADES
// ============================================================
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    if (m === '"') return "&quot;";
    return m;
  });
}
