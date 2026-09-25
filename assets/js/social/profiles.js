import { state } from "../var.js";
import { showSection } from "../navigation.js";
import { toggleFollowUser } from "./follow.js";
import { addPlaylistToLibrary, mergePlaylistsWithFriend } from "./playlist-actions.js";
import { showAlert } from "../modals.js";
import { getPublicProfile } from "../services/profileService.js";

let currentProfileUserId = null;

export async function openPublicProfile(userId) {
  if (userId == state.user_id) {
    showSection("profile");
    return;
  }

  currentProfileUserId = userId;
  showSection(`profile:${userId}`);

  const container = document.getElementById("publicProfileView");
  if (!container) {
    console.warn("publicProfileView no encontrado");
    return;
  }

  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="profile-loading">
      <div class="loading-spinner"></div>
      <p>Cargando perfil...</p>
    </div>
  `;

  try {
    const data = await getPublicProfile(userId);
    if (!data.success) {
      container.innerHTML = `
        <div class="profile-error">
          <i data-lucide="alert-circle"></i>
          <p>${data.message || "Error al cargar el perfil"}</p>
          <button class="btn-secondary" onclick="window.closePublicProfile()">Volver</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    renderPublicProfile(container, data);
  } catch (error) {
    console.error("Error al cargar perfil público:", error);
    container.innerHTML = `
      <div class="profile-error">
        <i data-lucide="alert-circle"></i>
        <p>Error de conexión al cargar el perfil</p>
        <button class="btn-secondary" onclick="window.closePublicProfile()">Volver</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function renderPublicProfile(container, data) {
  const { user, stats, playlists, reviews, is_following, are_friends, level, achievements } = data;

  const avatarUrl = user.avatar
    ? `${window.baseUrl}${user.avatar}?v=${Date.now()}`
    : `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(user.nombre_usuario)}`;

  let levelHtml = "";
  if (level) {
    const progress = level.id >= 6 ? 100 : 0;
    levelHtml = `
      <div class="profile-section">
        <h3 class="profile-section-title">Nivel y Logros</h3>
        <div class="level-display">
          <div class="level-icon">${level.icono}</div>
          <div class="level-info">
            <div class="level-name">Nivel ${level.id}: ${level.nombre}</div>
            <div class="level-xp">${level.xp_total} XP</div>
          </div>
          <div class="level-progress-container">
            <div class="level-progress-bar">
              <div class="level-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="level-progress-text">${level.id >= 6 ? "Nivel máximo" : `${level.xp_total} XP`}</div>
          </div>
        </div>
      </div>
    `;
  }

  let achievementsHtml = "";
  if (achievements && achievements.length > 0) {
    const unlockedCount = achievements.filter((a) => a.desbloqueado !== null).length;
    achievementsHtml = `
      <div class="profile-section">
        <h3 class="profile-section-title">Logros (${unlockedCount}/${achievements.length})</h3>
        <div class="achievements-grid">
          ${achievements
            .map((ach) => {
              const isUnlocked = ach.desbloqueado !== null;
              return `
              <div class="achievement-card ${isUnlocked ? "unlocked" : "locked"}">
                <div class="achievement-card-icon">${ach.icono}</div>
                <div class="achievement-card-name">${ach.nombre}</div>
                <div class="achievement-card-desc">${ach.descripcion || ""}</div>
                <div class="achievement-card-rareza ${ach.rareza}">${ach.rareza}</div>
                <div class="achievement-card-status">${isUnlocked ? "✅ Desbloqueado" : "🔒 Bloqueado"}</div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="public-profile-container">
      <button class="back-btn" onclick="window.closePublicProfile()">
        <i data-lucide="arrow-left"></i> Volver
      </button>

      <div class="profile-header">
        <div class="profile-avatar-wrapper">
          <img src="${avatarUrl}" class="profile-avatar" alt="${escapeHtml(user.nombre_usuario)}">
        </div>
        <div class="profile-info">
          <h1 class="profile-name">${escapeHtml(user.nombre_usuario)}</h1>
          <p class="profile-username">@${escapeHtml(user.nombre_usuario)}</p>
          <div class="profile-stats">
            <span class="profile-stat"><strong>${stats.followers}</strong> seguidores</span>
            <span class="profile-stat"><strong>${stats.following}</strong> siguiendo</span>
            <span class="profile-stat"><strong>${stats.playlists}</strong> playlists</span>
            <span class="profile-stat"><strong>${stats.reviews}</strong> reseñas</span>
          </div>
          <div class="profile-actions">
            <button id="btnFollowUser" class="btn-follow ${is_following ? "following" : ""}">
              <i data-lucide="${is_following ? "user-minus" : "user-plus"}"></i>
              ${is_following ? "Dejar de seguir" : "Seguir"}
            </button>
            <button id="btnMergePlaylists" class="btn-merge">
              <i data-lucide="git-merge"></i> Fusionar playlists
            </button>
          </div>
          ${!are_friends ? '<p class="profile-friend-hint">💡 Deben ser amigos para fusionar playlists</p>' : ""}
        </div>
      </div>

      ${levelHtml}
      ${achievementsHtml}

      <div class="profile-section">
        <h3 class="profile-section-title"><i data-lucide="music"></i> Playlists públicas</h3>
        <div id="publicPlaylistsGrid" class="playlists-grid">
          ${playlists.length === 0 ? '<p class="empty-message">No hay playlists públicas</p>' : ""}
        </div>
      </div>

      <div class="profile-section">
        <h3 class="profile-section-title"><i data-lucide="star"></i> Últimas reseñas</h3>
        <div id="publicReviewsList" class="reviews-list">
          ${reviews.length === 0 ? '<p class="empty-message">No hay reseñas todavía</p>' : ""}
        </div>
      </div>
    </div>
  `;

  const grid = document.getElementById("publicPlaylistsGrid");
  if (grid && playlists.length > 0) {
    grid.innerHTML = "";
    playlists.forEach((pl) => {
      const card = document.createElement("div");
      card.className = "playlist-card";
      card.innerHTML = `
        <img src="${pl.portada_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400"}" alt="${escapeHtml(pl.nombre)}">
        <h4>${escapeHtml(pl.nombre)}</h4>
        <button class="btn-add-to-library" data-playlist="${pl.id_playlist}" data-name="${escapeHtml(pl.nombre)}">
          <i data-lucide="plus-circle"></i> Añadir a mi biblioteca
        </button>
      `;
      grid.appendChild(card);
    });
  }

  const reviewsList = document.getElementById("publicReviewsList");
  if (reviewsList && reviews.length > 0) {
    reviewsList.innerHTML = "";
    reviews.forEach((r) => {
      const stars = "★".repeat(Math.floor(r.puntuacion)) + (r.puntuacion % 1 !== 0 ? "☆" : "");
      const div = document.createElement("div");
      div.className = "review-item";
      div.innerHTML = `
        <div class="review-header">
          <img src="${r.albumCover || "https://via.placeholder.com/48"}" class="review-cover" alt="Cover">
          <div class="review-meta">
            <div class="review-title">${escapeHtml(r.titulo_cancion_texto)}</div>
            <div class="review-artist">${escapeHtml(r.artista_texto)}</div>
          </div>
        </div>
        <div class="review-stars">${stars}</div>
        <div class="review-text">${escapeHtml(r.comentario)}</div>
        <div class="review-date">${new Date(r.fecha).toLocaleDateString()}</div>
      `;
      reviewsList.appendChild(div);
    });
  }

  document.getElementById("btnFollowUser")?.addEventListener("click", async () => {
    const isNowFollowing = await toggleFollowUser(currentProfileUserId, document.getElementById("btnFollowUser"));
    const statsEl = document.querySelector(".profile-stats");
    if (statsEl) {
      const span = statsEl.querySelector(".profile-stat:first-child");
      if (span) {
        const current = parseInt(span.textContent);
        span.innerHTML = `<strong>${isNowFollowing ? current + 1 : Math.max(0, current - 1)}</strong> seguidores`;
      }
    }
    openPublicProfile(currentProfileUserId);
  });

  document.getElementById("btnMergePlaylists")?.addEventListener("click", async () => {
    if (!are_friends) {
      await showAlert(
        "❌ Debes ser amigo de este usuario para fusionar playlists.<br><br>Para ser amigos, ambos deben seguirse mutuamente.",
        "No son amigos",
      );
      return;
    }
    const result = await mergePlaylistsWithFriend(currentProfileUserId, user.nombre_usuario);
    if (result) {
      openPublicProfile(currentProfileUserId);
    }
  });

  document.querySelectorAll(".btn-add-to-library").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const playlistId = btn.dataset.playlist;
      const playlistName = btn.dataset.name;
      await addPlaylistToLibrary(playlistId, playlistName);
      openPublicProfile(currentProfileUserId);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

window.openPublicProfile = openPublicProfile;
window.closePublicProfile = () => {
  const container = document.getElementById("publicProfileView");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
  showSection("home");
};

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
