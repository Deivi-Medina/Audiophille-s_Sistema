// assets/js/social/explore.js
import { toggleFollowUser } from "./follow.js";
import { getExploreUsers } from "../services/exploreService.js";

let exploreOffset = 0;
const EXPLORE_LIMIT = 20;
let isExploreLoading = false;
let hasMoreUsers = true;
let exploreSearchTerm = "";
let exploreFilter = "all";
let exploreObserver = null;

export async function loadExploreUsers(reset = true) {
  if (isExploreLoading) return;

  const container = document.getElementById("exploreUsersList");
  const loader = document.getElementById("exploreLoader");
  const end = document.getElementById("exploreEnd");
  const loading = document.getElementById("exploreLoading");

  if (!container) {
    console.warn("exploreUsersList no encontrado");
    return;
  }

  if (reset) {
    exploreOffset = 0;
    hasMoreUsers = true;
    container.innerHTML = "";
    if (end) end.classList.add("hidden");
    if (loading) loading.style.display = "flex";
  }

  isExploreLoading = true;
  if (loader) loader.classList.remove("hidden");

  try {
    const data = await getExploreUsers(exploreSearchTerm || "", EXPLORE_LIMIT, exploreOffset, exploreFilter);

    if (loading) loading.style.display = "none";

    if (!data.success) {
      if (reset) {
        container.innerHTML = `<div class="explore-error">⚠️ ${data.message || "Error al cargar usuarios"}</div>`;
      }
      return;
    }

    const totalEl = document.getElementById("totalUsersCount");
    if (totalEl && data.total !== undefined) {
      totalEl.textContent = data.total + " usuarios";
    }

    if (data.users.length === 0) {
      if (reset) {
        container.innerHTML = `
          <div class="explore-empty">
            <i data-lucide="users"></i>
            <h3>No se encontraron usuarios</h3>
            <p>${exploreSearchTerm ? `No hay resultados para "${exploreSearchTerm}"` : "No hay usuarios para mostrar"}</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
      hasMoreUsers = false;
      if (end) end.classList.add("hidden");
      return;
    }

    if (reset) container.innerHTML = "";

    data.users.forEach((user) => {
      const card = createUserCard(user);
      if (card) container.appendChild(card);
    });

    exploreOffset += data.users.length;
    hasMoreUsers = data.users.length === EXPLORE_LIMIT;

    if (end) {
      if (hasMoreUsers) end.classList.add("hidden");
      else end.classList.remove("hidden");
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error al explorar usuarios:", error);
    if (loading) loading.style.display = "none";
    if (reset) {
      container.innerHTML = `<div class="explore-error">❌ Error de conexión al cargar usuarios</div>`;
    }
  } finally {
    isExploreLoading = false;
    if (loader) loader.classList.add("hidden");
  }
}

function createUserCard(user) {
  if (!user || !user.id_usuario) {
    console.warn("Usuario inválido:", user);
    return null;
  }

  const card = document.createElement("div");
  card.className = "explore-user-card";

  const avatar = user.avatar
    ? `${window.baseUrl}${user.avatar}`
    : `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(user.nombre_usuario || "Usuario")}`;

  const isFollowing = user.is_following || false;

  card.innerHTML = `
    <img src="${avatar}" class="user-avatar" onclick="window.openPublicProfile(${user.id_usuario})" style="cursor:pointer;">
    <div class="user-name" onclick="window.openPublicProfile(${user.id_usuario})" style="cursor:pointer;">${escapeHtml(user.nombre_usuario)}</div>
    <div class="user-username">@${escapeHtml(user.nombre_usuario)}</div>
    <div class="user-followers"><strong>${user.followers_count || 0}</strong> seguidores</div>
    <button class="btn-follow-small ${isFollowing ? "following" : ""}" data-userid="${user.id_usuario}">
      ${isFollowing ? "Dejar de seguir" : "Seguir"}
    </button>
  `;

  const followBtn = card.querySelector(".btn-follow-small");
  followBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const userId = parseInt(followBtn.dataset.userid);
    const isNowFollowing = await toggleFollowUser(userId, followBtn);
    const followersSpan = card.querySelector(".user-followers strong");
    if (followersSpan) {
      const current = parseInt(followersSpan.textContent);
      followersSpan.textContent = isNowFollowing ? current + 1 : Math.max(0, current - 1);
    }
  });

  card.addEventListener("click", (e) => {
    if (!e.target.closest(".btn-follow-small")) {
      window.openPublicProfile(user.id_usuario);
    }
  });

  return card;
}

export function searchExploreUsers(term) {
  exploreSearchTerm = term.trim();
  const clearBtn = document.getElementById("exploreSearchClear");
  if (clearBtn) {
    clearBtn.classList.toggle("hidden", !exploreSearchTerm);
  }
  loadExploreUsers(true);
}

export function filterExploreUsers(filter) {
  exploreFilter = filter;
  loadExploreUsers(true);
}

export function clearExploreSearch() {
  const input = document.getElementById("exploreSearchInput");
  if (input) {
    input.value = "";
    exploreSearchTerm = "";
  }
  const clearBtn = document.getElementById("exploreSearchClear");
  if (clearBtn) clearBtn.classList.add("hidden");
  loadExploreUsers(true);
}

export function setupExploreInfiniteScroll() {
  const endElement = document.getElementById("exploreEnd");
  if (!endElement) return;

  if (exploreObserver) {
    exploreObserver.disconnect();
    exploreObserver = null;
  }

  exploreObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isExploreLoading && hasMoreUsers) {
        loadExploreUsers(false);
      }
    },
    {
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
    },
  );

  exploreObserver.observe(endElement);
}

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
