// assets/js/explore.js
import DOM, { state, loadInitialData } from "./var.js";
import { showSection } from "./navigation.js";
import { showAlert } from "./modals.js";
import { openAlbumView } from "./ui.js";
import { openArtistProfile } from "./artists.js";
import {
  getPublicAlbums,
  addAlbumToLibrary,
  removeAlbumFromLibrary,
  getPublicArtists,
  toggleFollowArtist,
} from "./services/explorerService.js";

let currentPage = 1;
let isLoading = false;
let hasMore = true;
let searchTerm = "";
let exploreObserver = null;
let artistCarouselLoaded = false;

export async function loadExploreAlbums(reset = true) {
  const container = document.getElementById("exploreGrid");
  const loader = document.getElementById("exploreLoader");

  if (!container) return;

  // Si hay término de búsqueda, el carrusel de artistas debe recargarse
  if (searchTerm) {
    artistCarouselLoaded = false;
  }

  if (reset) {
    currentPage = 1;
    hasMore = true;
    container.innerHTML = "";
    if (loader) loader.classList.add("hidden");
  }

  if (isLoading || !hasMore) return;
  isLoading = true;
  if (loader) loader.classList.remove("hidden");

  try {
    const data = await getPublicAlbums(currentPage, 20, searchTerm);
    if (!data.success) {
      await showAlert(data.message || "Error al cargar álbumes", "Error");
      return;
    }

    if (data.albums.length === 0) {
      if (reset) {
        container.innerHTML = `
          <div class="explore-empty">
            <i data-lucide="music"></i>
            <h3>No hay álbumes disponibles</h3>
            <p>${searchTerm ? `No se encontraron resultados para "${searchTerm}"` : "Todos los álbumes ya están en tu biblioteca"}</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
      hasMore = false;
      return;
    }

    data.albums.forEach((album) => {
      const card = createAlbumCard(album);
      container.appendChild(card);
    });

    currentPage++;
    hasMore = data.total > currentPage * 20;

    const totalSpan = document.getElementById("exploreTotalResults");
    if (totalSpan) {
      totalSpan.textContent = `${data.total} álbumes encontrados`;
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error en loadExploreAlbums:", error);
    await showAlert("Error de conexión al cargar álbumes", "Error");
  } finally {
    isLoading = false;
    if (loader) loader.classList.add("hidden");
  }
}

function createAlbumCard(album) {
  const card = document.createElement("article");
  card.className = "album-card explore-album-card";
  card.dataset.albumId = album.id_album;

  const isAdded = album.added === "1" || album.added === 1;

  card.innerHTML = `
    <div class="card-media-wrapper">
      <div class="card-media">
        <img src="${album.caratula_url || "https://picsum.photos/seed/" + album.id_album + "/300/300"}" alt="${escapeHtml(album.titulo)}">
        <div class="play-hint" data-action="preview">
          <i data-lucide="play"></i>
        </div>
      </div>
      <div class="card-reflection"></div>
      <span class="grid-card-tag tag-album">Álbum</span>
    </div>
    <div class="card-info">
      <h3>${escapeHtml(album.titulo)}</h3>
      <p class="artist-name">${escapeHtml(album.artista)}</p>
      <p class="album-meta">${album.anio || ""} ${album.genero ? "· " + escapeHtml(album.genero) : ""}</p>
      <button class="btn-add-to-library ${isAdded ? "added" : ""}" data-action="toggle-library">
        <i data-lucide="${isAdded ? "check" : "plus-circle"}"></i>
        ${isAdded ? "En tu biblioteca" : "Añadir a biblioteca"}
      </button>
    </div>
  `;

  card.addEventListener("click", (e) => {
    if (e.target.closest(".btn-add-to-library")) return;
    if (e.target.closest(".play-hint")) return;
    openAlbumView(album, true);
  });

  const addBtn = card.querySelector(".btn-add-to-library");
  addBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const isCurrentlyAdded = addBtn.classList.contains("added");
    if (isCurrentlyAdded) {
      await removeFromLibrary(album.id_album, addBtn);
    } else {
      await addToLibrary(album.id_album, addBtn);
    }
  });

  const playHint = card.querySelector(".play-hint");
  if (playHint) {
    playHint.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (album.songs && album.songs.length > 0) {
        const { setQueue, playActiveSong } = await import("./audio.js");
        const songsWithMetadata = album.songs.map((song) => ({
          ...song,
          artistName: album.artista,
          albumCover: album.caratula_url || "https://picsum.photos/seed/" + album.id_album + "/300/300",
          originalAlbumIdx: null,
        }));
        setQueue(songsWithMetadata, 0);
        playActiveSong();
        showSection("home");
      } else {
        await showAlert("Este álbum no tiene canciones disponibles para previsualizar.", "Sin canciones");
      }
    });
  }

  return card;
}

async function addToLibrary(albumId, buttonElement) {
  try {
    const data = await addAlbumToLibrary(albumId);
    if (data.success) {
      buttonElement.classList.add("added");
      buttonElement.innerHTML = `<i data-lucide="check"></i> En tu biblioteca`;
      if (window.lucide) window.lucide.createIcons();
      await showAlert("Álbum añadido a tu biblioteca", "Éxito", "success");
      await loadInitialData();
      const card = buttonElement.closest(".explore-album-card");
      if (card) {
        card.style.transition = "opacity 0.3s, transform 0.3s";
        card.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        setTimeout(() => {
          card.remove();
          const container = document.getElementById("exploreGrid");
          if (container && container.children.length === 0) {
            container.innerHTML = `
              <div class="explore-empty">
                <i data-lucide="music"></i>
                <h3>¡Todos los álbumes están en tu biblioteca!</h3>
                <p>Has añadido todos los álbumes disponibles. Vuelve más tarde para descubrir nueva música.</p>
              </div>
            `;
            if (window.lucide) window.lucide.createIcons();
          }
        }, 400);
      }
    } else {
      await showAlert(data.message || "Error al añadir el álbum", "Error");
    }
  } catch (error) {
    console.error("Error en addToLibrary:", error);
    await showAlert("Error de conexión", "Error");
  }
}

async function removeFromLibrary(albumId, buttonElement) {
  try {
    const data = await removeAlbumFromLibrary(albumId);
    if (data.success) {
      buttonElement.classList.remove("added");
      buttonElement.innerHTML = `<i data-lucide="plus-circle"></i> Añadir a biblioteca`;
      if (window.lucide) window.lucide.createIcons();
      await showAlert("Álbum eliminado de tu biblioteca", "Información", "info");
      await loadInitialData();
    } else {
      await showAlert(data.message || "Error al eliminar el álbum", "Error");
    }
  } catch (error) {
    console.error("Error en removeFromLibrary:", error);
    await showAlert("Error de conexión", "Error");
  }
}

function setupExploreSearch() {
  const searchInput = document.getElementById("exploreSearch");
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchTerm = e.target.value.trim();
      // Resetear flag para forzar recarga de artistas
      artistCarouselLoaded = false;
      loadExploreAlbums(true);
      loadExploreArtists();
    }, 400);
  });

  const clearBtn = document.getElementById("exploreSearchClear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchTerm = "";
      clearBtn.classList.add("hidden");
      // Resetear flag para forzar recarga de artistas
      artistCarouselLoaded = false;
      loadExploreAlbums(true);
      loadExploreArtists();
    });
    searchInput.addEventListener("input", () => {
      clearBtn.classList.toggle("hidden", !searchInput.value.trim());
    });
  }
}

function setupExploreInfiniteScroll() {
  const endElement = document.getElementById("exploreEnd");
  if (!endElement) return;

  if (exploreObserver) {
    exploreObserver.disconnect();
    exploreObserver = null;
  }

  exploreObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading && hasMore) {
        loadExploreAlbums(false);
      }
    },
    {
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
    },
  );

  exploreObserver.observe(endElement);
}

export async function loadExploreArtists() {
  const container = document.getElementById("exploreArtistsCarousel");
  if (!container) return;

  // Si ya se cargaron artistas y no hay término de búsqueda, no recargamos (a menos que se haya forzado)
  // Ahora siempre recargamos si hay búsqueda o si no hay búsqueda pero el carrusel no se ha cargado.
  if (!searchTerm && artistCarouselLoaded) return;

  try {
    const data = await getPublicArtists(20, searchTerm);
    if (!data.success || !data.artists || data.artists.length === 0) {
      container.innerHTML = `<p class="empty-message" style="text-align:center; color:var(--text-secondary); padding:16px;">${searchTerm ? `No hay artistas que coincidan con "${searchTerm}"` : "No hay artistas disponibles"}</p>`;
      return;
    }

    container.innerHTML = "";
    data.artists.forEach((artist) => {
      const card = createArtistCard(artist);
      container.appendChild(card);
    });

    artistCarouselLoaded = true;
    if (window.lucide) window.lucide.createIcons();
    setupCarouselControls();
  } catch (error) {
    console.error("Error cargando artistas:", error);
    container.innerHTML = `<p class="empty-message" style="text-align:center; color:var(--text-secondary);">Error al cargar artistas</p>`;
  }
}

function createArtistCard(artist) {
  const card = document.createElement("div");
  card.className = "artist-carousel-card";
  card.dataset.artistId = artist.id_artista;

  const isFollowing = artist.is_following === "1" || artist.is_following === 1;
  const avatar = artist.imagen_url
    ? artist.imagen_url
    : `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%239d4edd"/%3E%3Ctext x="50%25" y="50%25" font-size="32" text-anchor="middle" dy=".3em" fill="white" font-family="sans-serif"%3E${artist.nombre_artista.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;

  card.innerHTML = `
    <div class="artist-card-image">
      <img src="${avatar}" alt="${escapeHtml(artist.nombre_artista)}">
    </div>
    <div class="artist-card-name">${escapeHtml(artist.nombre_artista)}</div>
    <button class="btn-follow-artist ${isFollowing ? "following" : ""}" data-artist="${escapeHtml(artist.nombre_artista)}">
      ${isFollowing ? "Dejar de seguir" : "Seguir"}
    </button>
  `;

  const followBtn = card.querySelector(".btn-follow-artist");
  followBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const currentlyFollowing = followBtn.classList.contains("following");
    const newFollowing = !currentlyFollowing;
    followBtn.classList.toggle("following", newFollowing);
    followBtn.textContent = newFollowing ? "Dejar de seguir" : "Seguir";

    try {
      const result = await toggleFollowArtist(artist.nombre_artista, newFollowing);
      if (result) {
        if (newFollowing) {
          if (!state.followedArtists.includes(artist.nombre_artista)) {
            state.followedArtists.push(artist.nombre_artista);
          }
        } else {
          state.followedArtists = state.followedArtists.filter((name) => name !== artist.nombre_artista);
        }
      } else {
        followBtn.classList.toggle("following", currentlyFollowing);
        followBtn.textContent = currentlyFollowing ? "Dejar de seguir" : "Seguir";
        await showAlert("Error al actualizar el seguimiento", "Error");
      }
    } catch (error) {
      followBtn.classList.toggle("following", currentlyFollowing);
      followBtn.textContent = currentlyFollowing ? "Dejar de seguir" : "Seguir";
      await showAlert("Error de conexión", "Error");
    }
  });

  card.addEventListener("click", (e) => {
    if (e.target.closest(".btn-follow-artist")) return;
    openArtistProfile(artist.nombre_artista);
  });

  return card;
}

export function initExplore() {
  setupExploreSearch();
  setupExploreInfiniteScroll();

  const exploreView = DOM.views.explore;
  if (exploreView) {
    const observer = new MutationObserver(() => {
      if (!exploreView.classList.contains("hidden")) {
        loadExploreAlbums(true);
        loadExploreArtists();
      }
    });
    observer.observe(exploreView, { attributes: true, attributeFilter: ["class"] });
  }

  if (exploreView && !exploreView.classList.contains("hidden")) {
    loadExploreAlbums(true);
    loadExploreArtists();
  }
}

function setupCarouselControls() {
  const carousel = document.getElementById("exploreArtistsCarousel");
  const leftBtn = document.getElementById("artistCarouselLeft");
  const rightBtn = document.getElementById("artistCarouselRight");

  if (!carousel) return;
  if (!leftBtn || !rightBtn) {
    console.warn("Botones del carrusel no encontrados en el DOM");
    return;
  }

  const scrollAmount = 160;

  leftBtn.replaceWith(leftBtn.cloneNode(true));
  rightBtn.replaceWith(rightBtn.cloneNode(true));

  const newLeftBtn = document.getElementById("artistCarouselLeft");
  const newRightBtn = document.getElementById("artistCarouselRight");

  if (newLeftBtn) {
    newLeftBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });
  }
  if (newRightBtn) {
    newRightBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }

  const checkScroll = () => {
    const hasScroll = carousel.scrollWidth > carousel.clientWidth;
    if (newLeftBtn) newLeftBtn.style.display = hasScroll ? "flex" : "none";
    if (newRightBtn) newRightBtn.style.display = hasScroll ? "flex" : "none";
  };

  checkScroll();
  window.addEventListener("resize", checkScroll);
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
