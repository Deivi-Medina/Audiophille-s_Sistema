// assets/js/social/feed.js
import { getFeed } from "../services/feedService.js";

let feedOffset = 0;
const FEED_LIMIT = 20;
let isLoading = false;
let hasMore = true;
let currentFilter = "all";
let feedObserver = null;

// ✅ MAPEO DE FILTROS (frontend → backend)
const FILTER_MAP = {
  all: "all",
  playlist: "playlist_creada",
  review: "reseña",
  follow: "seguimiento",
};

export async function loadFeed(reset = true) {
  if (isLoading) return;

  const container = document.getElementById("feedList");
  const loader = document.getElementById("feedLoader");
  const end = document.getElementById("feedEnd");
  const empty = document.getElementById("feedEmpty");

  if (!container) {
    console.warn("feedList no encontrado en el DOM");
    return;
  }

  if (reset) {
    feedOffset = 0;
    hasMore = true;
    container.innerHTML = "";
    if (end) end.classList.add("hidden");
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "feedLoadingState";
    loadingDiv.className = "feed-loading-state";
    loadingDiv.innerHTML = `<div class="loading-spinner"></div><span>Cargando feed...</span>`;
    container.appendChild(loadingDiv);
  }

  isLoading = true;
  if (loader) loader.classList.remove("hidden");

  try {
    // ✅ Usar el filtro mapeado o el original si no está en el mapa
    const filterToSend = FILTER_MAP[currentFilter] || currentFilter;
    const data = await getFeed(FEED_LIMIT, feedOffset, filterToSend);

    const loadingState = document.getElementById("feedLoadingState");
    if (loadingState) loadingState.remove();

    if (!data.success) {
      if (reset) {
        container.innerHTML = `<div class="feed-error">⚠️ ${data.message || "Error al cargar el feed"}</div>`;
      }
      return;
    }

    if (data.feed.length === 0) {
      if (reset) {
        const filterNames = {
          all: "actividad",
          playlist_creada: "playlists",
          reseña: "reseñas",
          seguimiento: "seguidores",
        };
        const filterName = filterNames[filterToSend] || "actividad";

        container.innerHTML = `
                    <div class="feed-empty">
                        <i data-lucide="users" class="feed-empty-icon"></i>
                        <h3>No hay ${filterName} en tu feed</h3>
                        <p>Sigue a otros usuarios para ver su actividad aquí</p>
                        <button class="btn-primary feed-empty-btn" onclick="document.querySelector('[data-tab=\\'explore\\']')?.click()">
                            <i data-lucide="compass"></i> Explorar usuarios
                        </button>
                    </div>
                `;
        if (window.lucide) window.lucide.createIcons();
      }
      hasMore = false;
      if (end) end.classList.add("hidden");
      return;
    }

    if (empty) empty.classList.add("hidden");

    data.feed.forEach((item) => {
      const feedItem = createFeedItem(item);
      if (feedItem) {
        container.appendChild(feedItem);
      }
    });

    feedOffset += data.feed.length;
    hasMore = data.feed.length === FEED_LIMIT;

    if (end) {
      if (hasMore) {
        end.classList.add("hidden");
      } else {
        end.classList.remove("hidden");
      }
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error al cargar feed:", error);
    const loadingState = document.getElementById("feedLoadingState");
    if (loadingState) loadingState.remove();
    if (reset) {
      container.innerHTML = `<div class="feed-error">❌ Error de conexión al cargar el feed</div>`;
    }
  } finally {
    isLoading = false;
    if (loader) loader.classList.add("hidden");
  }
}

function createFeedItem(item) {
  if (!item || !item.id_usuario) {
    console.warn("Item inválido:", item);
    return null;
  }

  const div = document.createElement("div");
  div.className = "feed-item";

  const avatar = item.avatar
    ? `${window.baseUrl}${item.avatar}`
    : `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(item.nombre_usuario || "Usuario")}`;

  const timeAgo = getTimeAgo(new Date(item.fecha));

  let icon = "📌";
  let actionText = "";
  switch (item.tipo_actividad) {
    case "reseña":
      icon = "⭐";
      actionText = "hizo una reseña";
      break;
    case "playlist_creada":
      icon = "📀";
      actionText = "creó una playlist";
      break;
    case "favorito":
      icon = "❤️";
      actionText = "marcó como favorita";
      break;
    case "seguimiento":
      icon = "👤";
      actionText = "comenzó a seguir a";
      break;
    default:
      icon = "📌";
      actionText = "realizó una acción";
  }

  div.innerHTML = `
        <div class="feed-user" onclick="window.openPublicProfile(${item.id_usuario})">
            <img src="${avatar}" class="feed-avatar" alt="${escapeHtml(item.nombre_usuario || "Usuario")}">
            <span class="feed-user-name">${escapeHtml(item.nombre_usuario || "Usuario")}</span>
            <span class="feed-time">${timeAgo}</span>
        </div>
        <div class="feed-action">${icon} ${actionText}</div>
        <div class="feed-description">${escapeHtml(item.descripcion || "")}</div>
    `;

  return div;
}

export function setupFeedInfiniteScroll() {
  const endElement = document.getElementById("feedEnd");
  if (!endElement) {
    console.warn("feedEnd no encontrado en el DOM");
    return;
  }

  if (feedObserver) {
    feedObserver.disconnect();
    feedObserver = null;
  }

  feedObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading && hasMore) {
        loadFeed(false);
      }
    },
    {
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
    },
  );

  feedObserver.observe(endElement);
}

// ✅ FILTRO CON MAPEO CORRECTO
export function filterFeed(filter) {
  // Guardamos el valor original para la UI
  currentFilter = filter;
  // Recargamos con el filtro mapeado
  loadFeed(true);
}

function getTimeAgo(date) {
  if (!date || isNaN(date.getTime())) return "hace un momento";
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "hace " + diff + "s";
  if (diff < 3600) return "hace " + Math.floor(diff / 60) + "m";
  if (diff < 86400) return "hace " + Math.floor(diff / 3600) + "h";
  if (diff < 604800) return "hace " + Math.floor(diff / 86400) + "d";
  return date.toLocaleDateString();
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
