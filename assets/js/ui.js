// js/ui.js
import DOM, { state, preloadDurations, loadInitialData } from "./var.js";
import { queue, queueIndex, playActiveSong, setQueue, reorderQueue, player, queueManager } from "./audio.js";
import { renderReviews } from "./reviews.js";
import { showSection } from "./navigation.js";
import { showAlert } from "./modals.js";
import { openArtistProfile } from "./artists.js";
import { addSongToPlaylist } from "./services/playlistService.js";
import { addAlbumToLibrary } from "./services/explorerService.js";

let contextMenuSong = null;
let draggedIndex = null;
let dragOverIndex = null;

// ============================================================
// ESCUCHAR EVENTO DE CARGA DEL REPRODUCTOR
// ============================================================
document.addEventListener("playerLoading", (e) => {
  const loading = e.detail.loading;
  const nextBtn = document.getElementById("btnNext");
  const prevBtn = document.getElementById("btnPrev");
  if (nextBtn) nextBtn.disabled = loading;
  if (prevBtn) prevBtn.disabled = loading;
});

// Inicializar estado de los botones al cargar
setTimeout(() => {
  const loading = player.isLoading ? player.isLoading() : false;
  const nextBtn = document.getElementById("btnNext");
  const prevBtn = document.getElementById("btnPrev");
  if (nextBtn) nextBtn.disabled = loading;
  if (prevBtn) prevBtn.disabled = loading;
}, 100);

// ============================================================
// UTILIDADES
// ============================================================
function isYouTubeSong(song) {
  const url = song.file || song.archivo_url || "";
  return url.startsWith("youtube:");
}

function getYouTubeIcon() {
  return `<span style="color:#ff0000; margin-left:4px; font-size:14px; font-weight:bold;">▶️</span>`;
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

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function getAlbums() {
  return window.albumsFromDB || [];
}

async function refreshUI() {
  await loadInitialData();
  renderAlbumCards();
  if (state.activePlaylistName) {
    renderPlaylistDetailView(state.activePlaylistName);
  }
}

function getAllAvailableSongs() {
  const all = [];
  const albums = getAlbums();
  albums.forEach((album, albumIdx) => {
    if (album.songs && Array.isArray(album.songs)) {
      album.songs.forEach((song) => {
        all.push({
          trackTitle: song.trackTitle,
          artistName: song.artistName || album.artist,
          albumCover: song.albumCover || album.cover,
          file: song.file || song.archivo_url,
          id_cancion: song.id_cancion,
          originalAlbumIdx: albumIdx,
        });
      });
    }
  });
  if (state.importedSongs && Array.isArray(state.importedSongs)) {
    state.importedSongs.forEach((song) => {
      all.push({
        trackTitle: song.trackTitle,
        artistName: song.artistName || "Importado",
        albumCover: song.albumCover || "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
        file: song.file || song.archivo_url,
        id_cancion: song.id_cancion,
        originalAlbumIdx: -1,
      });
    });
  }
  return all;
}

// ============================================================
// RENDERIZADO DE ÁLBUMES (Inicio)
// ============================================================
export function renderAlbumCards(query = "") {
  if (!DOM.views.albumGrid) return;
  DOM.views.albumGrid.innerHTML = "";
  const playlistsGrid = document.getElementById("playlistsGrid");
  if (playlistsGrid) playlistsGrid.innerHTML = "";

  const cleanQuery = query.toLowerCase().trim();
  const albums = getAlbums();

  albums.forEach((album, idx) => {
    if (cleanQuery && !album.title.toLowerCase().includes(cleanQuery) && !album.artist.toLowerCase().includes(cleanQuery)) return;
    const card = document.createElement("article");
    card.className = "album-card";
    card.innerHTML = `
      <div class="card-media-wrapper">
        <div class="card-media">
          <img src="${album.cover}" alt="${album.title}">
          <div class="play-hint"><i data-lucide="play"></i></div>
        </div>
        <div class="card-reflection"></div>
        <span class="grid-card-tag tag-album">Álbum</span>
      </div>
      <div class="card-info">
        <h3>${escapeHtml(album.title)}</h3>
        <p class="artist-name" style="cursor:pointer; display:inline-block; color:var(--text-secondary); transition:color 0.2s;">${escapeHtml(album.artist)}</p>
      </div>
    `;

    const artistP = card.querySelector(".artist-name");
    artistP.addEventListener("click", (e) => {
      e.stopPropagation();
      openArtistProfile(album.artist);
    });
    artistP.addEventListener("mouseenter", () => {
      artistP.style.color = "var(--text-primary)";
    });
    artistP.addEventListener("mouseleave", () => {
      artistP.style.color = "var(--text-secondary)";
    });

    card.addEventListener("click", (e) => {
      if (e.target.closest(".play-hint")) return;
      if (e.target.classList.contains("artist-name")) return;
      openAlbumView(idx);
    });

    const playBtn = card.querySelector(".play-hint");
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        playNewAlbumQueue(idx, 0);
      });
    }
    DOM.views.albumGrid.appendChild(card);
  });

  if (DOM.views.albumGrid.children.length === 0) {
    DOM.views.albumGrid.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-secondary);">No se encontraron álbumes en tu biblioteca.</div>`;
  }

  if (playlistsGrid) {
    const playlistNames = Object.keys(state.playlists);
    playlistNames.forEach((pName) => {
      const playlist = state.playlists[pName];
      if (cleanQuery && !pName.toLowerCase().includes(cleanQuery)) return;
      const card = document.createElement("article");
      card.className = "album-card";
      card.innerHTML = `
        <div class="card-media-wrapper">
          <div class="card-media">
            <img src="${playlist.portada}" alt="${pName}">
            <div class="play-hint play-hint-purple"><i data-lucide="play"></i></div>
          </div>
          <div class="card-reflection"></div>
          <span class="grid-card-tag tag-playlist">Playlist</span>
        </div>
        <div class="card-info">
          <h3>${escapeHtml(pName)}</h3>
          <p>${playlist.canciones.length} canción(es)</p>
        </div>
      `;
      card.addEventListener("click", (e) => {
        if (e.target.closest(".play-hint")) return;
        showSection(`playlist:${pName}`);
      });
      const playBtn = card.querySelector(".play-hint");
      if (playBtn) {
        playBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (playlist.canciones.length > 0) {
            setQueue(
              playlist.canciones.map((song) => ({
                ...song,
                artistName: song.artistName || "Playlist",
                albumCover: song.albumCover || playlist.portada,
                originalAlbumIdx: song.originalAlbumIdx,
              })),
              0,
            );
            playActiveSong();
          } else {
            await showAlert("Esta playlist no tiene canciones para reproducir.", "Playlist vacía");
          }
        });
      }
      playlistsGrid.appendChild(card);
    });
    if (playlistNames.length === 0) {
      playlistsGrid.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-secondary); background:rgba(255,255,255,0.01); border-radius:12px; border:1px dashed var(--glass-border);">No has creado ninguna playlist todavía. ¡Crea una para organizarla!</div>`;
    } else if (playlistsGrid.children.length === 0) {
      playlistsGrid.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-secondary);">No se encontraron playlists que coincidan con la búsqueda.</div>`;
    }
  }
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// VISTA DETALLE DE ÁLBUM / PLAYLIST (CORREGIDA)
// ============================================================
export async function openAlbumView(albumOrIndex, fromExplore = false) {
  if (DOM.views.artistProfile) DOM.views.artistProfile.classList.add("hidden");

  let album;
  let idx;

  if (typeof albumOrIndex === "number") {
    const albums = getAlbums();
    idx = albumOrIndex;
    album = albums[idx];
    if (!album) return;
    fromExplore = false;
  } else if (typeof albumOrIndex === "object" && albumOrIndex.id_album) {
    album = albumOrIndex;
    idx = -1;
  } else {
    return;
  }

  // Si viene desde explorar o desde el perfil del artista y no tiene todas las canciones, cargar detalle completo
  if (fromExplore && album && album.id_album && (!album.songs || album.songs.length === 0 || album.songs.length < 5)) {
    try {
      const res = await fetch(`${window.baseUrl}api.php?action=get_album_detail&id_album=${album.id_album}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.album) {
        album = data.album;
      }
    } catch (e) {
      console.warn("Error cargando detalle del álbum:", e);
    }
  }

  if (!album) return;

  state.activeAlbumIndex = idx;
  state.activePlaylistName = null;
  state.currentSection = "home";
  state.fromExplore = fromExplore || false;

  if (DOM.extra.playlistInlineContainer) DOM.extra.playlistInlineContainer.classList.add("hidden");
  if (DOM.views.library) DOM.views.library.classList.add("hidden");
  if (DOM.views.explore) DOM.views.explore.classList.add("hidden");
  if (DOM.views.albumDetail) DOM.views.albumDetail.classList.remove("hidden");

  if (DOM.currentAlbumDetail.cover) DOM.currentAlbumDetail.cover.src = album.caratula_url || album.cover;
  if (DOM.currentAlbumDetail.title) DOM.currentAlbumDetail.title.innerText = album.titulo || album.title;

  if (DOM.currentAlbumDetail.artist) {
    const artistSpan = document.createElement("span");
    artistSpan.className = "artist-clickable";
    artistSpan.textContent = album.artista || album.artist;
    artistSpan.style.cursor = "pointer";
    artistSpan.style.color = "var(--text-secondary)";
    artistSpan.style.transition = "color 0.2s";
    artistSpan.addEventListener("mouseenter", () => (artistSpan.style.color = "var(--text-primary)"));
    artistSpan.addEventListener("mouseleave", () => (artistSpan.style.color = "var(--text-secondary)"));
    artistSpan.addEventListener("click", (e) => {
      e.stopPropagation();
      openArtistProfile(album.artista || album.artist);
    });
    DOM.currentAlbumDetail.artist.innerHTML = "";
    DOM.currentAlbumDetail.artist.appendChild(artistSpan);
  }

  const isUserAlbum = album.id_usuario === state.user_id || !fromExplore;
  const isAdded = album.added === "1" || album.added === 1 || isUserAlbum;

  if (DOM.albumActions.row) {
    DOM.albumActions.row.style.display = "flex";
    if (isAdded && isUserAlbum) {
      DOM.albumActions.btnEdit.style.display = "flex";
      DOM.albumActions.btnDelete.style.display = "flex";
      DOM.albumActions.btnEdit.innerHTML = `<i data-lucide="pencil" style="width:14px; height:14px;"></i> Editar Álbum`;
      DOM.albumActions.btnDelete.innerHTML = `<i data-lucide="trash-2" style="width:14px; height:14px;"></i> Eliminar Álbum`;
      const addBtn = document.getElementById("btnAddAlbumFromDetail");
      if (addBtn) addBtn.style.display = "none";
    } else if (!isAdded) {
      DOM.albumActions.btnEdit.style.display = "none";
      DOM.albumActions.btnDelete.style.display = "none";
      let addBtn = document.getElementById("btnAddAlbumFromDetail");
      if (!addBtn) {
        addBtn = document.createElement("button");
        addBtn.id = "btnAddAlbumFromDetail";
        addBtn.className = "btn-add-to-library";
        addBtn.innerHTML = `<i data-lucide="plus-circle"></i> Añadir a biblioteca`;
        DOM.albumActions.row.appendChild(addBtn);
      }
      addBtn.style.display = "flex";
      addBtn.onclick = async () => {
        try {
          const data = await addAlbumToLibrary(album.id_album);
          if (data.success) {
            await loadInitialData();
            renderAlbumCards();
            await showAlert("Álbum añadido a tu biblioteca", "Éxito", "success");
            // Recargar la vista de detalle para actualizar botones
            openAlbumView(album, fromExplore);
          } else {
            await showAlert(data.message || "Error al añadir", "Error");
          }
        } catch (err) {
          await showAlert("Error de conexión", "Error");
        }
      };
    } else {
      DOM.albumActions.btnEdit.style.display = "none";
      DOM.albumActions.btnDelete.style.display = "none";
      const addBtn = document.getElementById("btnAddAlbumFromDetail");
      if (addBtn) addBtn.style.display = "none";
    }
  }

  if (DOM.views.tracksList) DOM.views.tracksList.innerHTML = "";
  const songs = album.songs || [];
  songs.forEach((song, songIdx) => {
    const currentSong = queueManager.getCurrentSong();
    const activeClass = currentSong && currentSong.file === song.file ? "active-track" : "";
    const row = document.createElement("div");
    row.className = `track-row ${activeClass}`;
    const youtubeIcon = isYouTubeSong(song) ? getYouTubeIcon() : "";
    row.innerHTML = `
      <span class="track-number">${songIdx + 1}</span>
      <span class="track-title">${escapeHtml(song.titulo || song.trackTitle)}${youtubeIcon}</span>
      <span class="track-album-inside">${escapeHtml(album.titulo || album.title)}</span>
      <span class="track-duration">${song.duracion_segundos ? formatDuration(song.duracion_segundos) : "--:--"}</span>
      <button class="btn-track-actions"><i data-lucide="more-horizontal"></i></button>
    `;
    row.addEventListener("click", () => {
      setQueue(
        songs.map((s) => ({
          ...s,
          artistName: album.artista || album.artist,
          albumCover: album.caratula_url || album.cover,
          originalAlbumIdx: idx,
        })),
        songIdx,
      );
      playActiveSong();
    });
    const btnActions = row.querySelector(".btn-track-actions");
    btnActions.addEventListener("click", (e) => {
      e.stopPropagation();
      openContextMenuAt(e, song, songIdx, idx);
    });
    if (DOM.views.tracksList) DOM.views.tracksList.appendChild(row);
  });

  preloadDurations(songs, DOM.views.tracksList);
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// VISTA FAVORITOS
// ============================================================
export function renderFavoritesDetailView() {
  if (DOM.currentAlbumDetail.cover) {
    DOM.currentAlbumDetail.cover.src = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
  }
  if (DOM.currentAlbumDetail.title) DOM.currentAlbumDetail.title.innerText = "Mis Favoritos";
  if (DOM.currentAlbumDetail.artist) DOM.currentAlbumDetail.artist.innerText = "Tus canciones con corazones";
  if (DOM.views.tracksList) DOM.views.tracksList.innerHTML = "";
  state.favorites.forEach((song, songIdx) => {
    const currentSong = queueManager.getCurrentSong();
    const activeClass = currentSong && currentSong.file === song.file ? "active-track" : "";
    const row = document.createElement("div");
    row.className = `track-row ${activeClass}`;
    const youtubeIcon = isYouTubeSong(song) ? getYouTubeIcon() : "";
    row.innerHTML = `
      <span class="track-number"><i data-lucide="heart" style="color:#ff2d55; width:14px; fill:#ff2d55;"></i></span>
      <span class="track-title">${escapeHtml(song.trackTitle)}${youtubeIcon}</span>
      <span class="track-album-inside">${escapeHtml(song.artistName)}</span>
      <span class="track-duration">${song.duracion_segundos ? formatDuration(song.duracion_segundos) : "--:--"}</span>
      <button class="btn-track-actions"><i data-lucide="more-horizontal"></i></button>
    `;
    row.addEventListener("click", () => {
      setQueue([...state.favorites], songIdx);
      playActiveSong();
    });
    const btnActions = row.querySelector(".btn-track-actions");
    btnActions.addEventListener("click", (e) => {
      e.stopPropagation();
      openContextMenuAt(e, song, songIdx, song.originalAlbumIdx);
    });
    if (DOM.views.tracksList) DOM.views.tracksList.appendChild(row);
  });
  preloadDurations(state.favorites, DOM.views.tracksList);
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// VISTA PLAYLIST DETALLE
// ============================================================
export function renderPlaylistDetailView(playlistName) {
  const playData = state.playlists[playlistName];
  if (!playData) return;
  if (DOM.currentAlbumDetail.cover) DOM.currentAlbumDetail.cover.src = playData.portada;
  if (DOM.currentAlbumDetail.title) DOM.currentAlbumDetail.title.innerText = playlistName;
  if (DOM.currentAlbumDetail.artist) DOM.currentAlbumDetail.artist.innerText = "Playlist Personalizada";
  if (DOM.albumActions.row) DOM.albumActions.row.style.display = "flex";
  if (DOM.albumActions.btnEdit) {
    DOM.albumActions.btnEdit.innerHTML = `<i data-lucide="pencil" style="width:14px; height:14px;"></i> Editar Playlist`;
  }
  if (DOM.albumActions.btnDelete) {
    DOM.albumActions.btnDelete.innerHTML = `<i data-lucide="trash-2" style="width:14px; height:14px;"></i> Eliminar Playlist`;
  }
  if (DOM.extra.playlistInlineContainer) {
    DOM.extra.playlistInlineContainer.classList.remove("hidden");
    renderPlaylistAddSongInline(playlistName, DOM.extra.playlistInlineContainer);
  }
  if (DOM.views.tracksList) DOM.views.tracksList.innerHTML = "";
  playData.canciones.forEach((song, songIdx) => {
    const currentSong = queueManager.getCurrentSong();
    const activeClass = currentSong && currentSong.file === song.file ? "active-track" : "";
    const row = document.createElement("div");
    row.className = `track-row ${activeClass}`;
    const youtubeIcon = isYouTubeSong(song) ? getYouTubeIcon() : "";
    row.innerHTML = `
      <span class="track-number">${songIdx + 1}</span>
      <span class="track-title">${escapeHtml(song.trackTitle)}${youtubeIcon}</span>
      <span class="track-album-inside">${escapeHtml(song.artistName)}</span>
      <span class="track-duration">${song.duracion_segundos ? formatDuration(song.duracion_segundos) : "--:--"}</span>
      <button class="btn-track-actions"><i data-lucide="more-horizontal"></i></button>
    `;
    row.addEventListener("click", () => {
      setQueue([...playData.canciones], songIdx);
      playActiveSong();
    });
    const btnActions = row.querySelector(".btn-track-actions");
    btnActions.addEventListener("click", (e) => {
      e.stopPropagation();
      openContextMenuAt(e, song, songIdx, song.originalAlbumIdx);
    });
    if (DOM.views.tracksList) DOM.views.tracksList.appendChild(row);
  });
  preloadDurations(playData.canciones, DOM.views.tracksList);
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// COLA DE REPRODUCCIÓN (con "Ahora suena" + lista de cola)
// ============================================================
export function renderQueueSidebarList() {
  const container = DOM.queue.dynamicList;
  if (!container) return;
  container.innerHTML = "";

  const currentSong = queueManager.getCurrentSong();
  const userSongs = queueManager.userQueue || [];
  const contextSongs = queueManager.contextSongs || [];
  const contextIndex = queueManager.contextIndex || 0;

  // --- Sección: "Ahora suena" (canción actual) ---
  const nowPlayingSection = document.createElement("div");
  nowPlayingSection.className = "queue-now-playing";

  if (currentSong) {
    const coverUrl = currentSong.albumCover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
    nowPlayingSection.innerHTML = `
      <div class="queue-now-playing-content">
        <div class="queue-now-playing-cover">
          <img src="${coverUrl}" alt="Portada">
          <div class="queue-now-playing-indicator">
            <i data-lucide="volume-2"></i>
            <span class="playing-dots">
              <span></span><span></span><span></span>
            </span>
          </div>
        </div>
        <div class="queue-now-playing-info">
          <div class="queue-now-playing-label">
            <i data-lucide="play-circle"></i> Ahora suena
          </div>
          <div class="queue-now-playing-title">${escapeHtml(currentSong.trackTitle)}</div>
          <div class="queue-now-playing-artist">${escapeHtml(currentSong.artistName)}</div>
        </div>
      </div>
    `;
  } else {
    nowPlayingSection.innerHTML = `
      <div class="queue-now-playing-content queue-empty-state">
        <div class="queue-now-playing-info">
          <div class="queue-now-playing-label" style="color:var(--text-muted);">
            <i data-lucide="pause-circle"></i> Sin reproducción
          </div>
          <div class="queue-now-playing-title" style="color:var(--text-secondary); font-weight:400;">Selecciona una canción para comenzar</div>
        </div>
      </div>
    `;
  }
  container.appendChild(nowPlayingSection);

  // --- Separador ---
  const divider = document.createElement("div");
  divider.className = "queue-divider";
  container.appendChild(divider);

  // --- Lista de cola (userQueue + contexto restante) ---
  const queueList = document.createElement("div");
  queueList.className = "queue-list-container";

  let queueSongs = [];
  let queueLabels = [];

  let userQueueToShow = [...userSongs];
  if (currentSong && userQueueToShow.length > 0) {
    if (userQueueToShow[0] && userQueueToShow[0].id_cancion === currentSong.id_cancion) {
      userQueueToShow.shift();
    }
  }

  let contextRemaining = contextSongs.slice(contextIndex);
  if (currentSong && contextRemaining.length > 0) {
    if (contextRemaining[0] && contextRemaining[0].id_cancion === currentSong.id_cancion) {
      contextRemaining.shift();
    }
  }

  if (userQueueToShow.length > 0) {
    queueSongs = queueSongs.concat(userQueueToShow);
    queueLabels = queueLabels.concat(userQueueToShow.map(() => "user"));
  }
  if (contextRemaining.length > 0) {
    queueSongs = queueSongs.concat(contextRemaining);
    queueLabels = queueLabels.concat(contextRemaining.map(() => "context"));
  }

  if (queueSongs.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "queue-empty";
    emptyMsg.textContent = "La cola está vacía";
    queueList.appendChild(emptyMsg);
  } else {
    let userAdded = false;
    let contextAdded = false;

    queueSongs.forEach((song, idx) => {
      const isUser = queueLabels[idx] === "user";
      const isContext = queueLabels[idx] === "context";

      if (isUser && !userAdded) {
        const header = document.createElement("div");
        header.className = "queue-section-header";
        header.textContent = "Tu cola";
        queueList.appendChild(header);
        userAdded = true;
      }
      if (isContext && !contextAdded) {
        const header = document.createElement("div");
        header.className = "queue-section-header";
        header.textContent = "A continuación";
        queueList.appendChild(header);
        contextAdded = true;
      }

      const item = createQueueItem(song, idx, isUser, false);
      queueList.appendChild(item);
    });
  }

  container.appendChild(queueList);

  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// FUNCIÓN AUXILIAR PARA CREAR UN ELEMENTO DE LA COLA
// ============================================================
function createQueueItem(song, index, isUserQueue, isActive = false) {
  const item = document.createElement("div");
  item.className = `queue-item ${isActive ? "queue-active" : ""}`;
  item.draggable = isUserQueue;
  item.dataset.index = index;
  item.dataset.source = isUserQueue ? "user" : "context";

  const youtubeIcon = isYouTubeSong(song) ? getYouTubeIcon() : "";
  item.innerHTML = `
    <div class="queue-title">${escapeHtml(song.trackTitle)}${youtubeIcon}</div>
    <div class="queue-artist">${escapeHtml(song.artistName)}</div>
  `;

  if (isUserQueue) {
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragenter", handleDragEnter);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);
  }

  item.addEventListener("click", () => {
    if (isUserQueue) {
      const currentUser = queueManager.userQueue;
      const idx = currentUser.findIndex((s, i) => i === index);
      if (idx !== -1) {
        const songToPlay = currentUser[idx];
        const newUserQueue = [songToPlay, ...currentUser.filter((_, i) => i !== idx)];
        queueManager.userQueue = newUserQueue;
        queueManager._notifyQueueChanged();
        playActiveSong();
      }
    } else {
      const realIndex = queueManager.contextIndex + index;
      if (realIndex < queueManager.contextSongs.length) {
        queueManager.contextIndex = realIndex;
        queueManager._notifyQueueChanged();
        playActiveSong();
      }
    }
  });

  return item;
}

// ============================================================
// MANEJADORES DE DRAG & DROP (solo para userQueue)
// ============================================================
function handleDragStart(e) {
  draggedIndex = parseInt(this.dataset.index);
  if (this.dataset.source !== "user") {
    e.preventDefault();
    return;
  }
  this.style.opacity = "0.5";
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", String(draggedIndex));
}

function handleDragEnter(e) {
  e.preventDefault();
  if (this.dataset.source !== "user") return;
  this.classList.add("drag-over");
}

function handleDragOver(e) {
  e.preventDefault();
  if (this.dataset.source !== "user") return;
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();
  if (this.dataset.source !== "user") return;
  this.classList.remove("drag-over");

  const targetIndex = parseInt(this.dataset.index);
  const fromIndex = draggedIndex !== null ? draggedIndex : parseInt(e.dataTransfer.getData("text/plain"));

  if (fromIndex !== null && targetIndex !== null && fromIndex !== targetIndex) {
    const userLen = queueManager.userQueue.length;
    if (fromIndex >= 0 && fromIndex < userLen && targetIndex >= 0 && targetIndex < userLen) {
      const [removed] = queueManager.userQueue.splice(fromIndex, 1);
      queueManager.userQueue.splice(targetIndex, 0, removed);
      queueManager._notifyQueueChanged();
      renderQueueSidebarList();
    }
  }

  draggedIndex = null;
  dragOverIndex = null;
}

function handleDragEnd(e) {
  this.style.opacity = "1";
  document.querySelectorAll(".queue-item").forEach((el) => el.classList.remove("drag-over"));
  draggedIndex = null;
  dragOverIndex = null;
}

// ============================================================
// OTRAS FUNCIONES DE RENDERIZADO
// ============================================================
function renderPlaylistAddSongInline(playlistName, container) {
  const allSongs = getAllAvailableSongs();
  const playlist = state.playlists[playlistName];
  if (!playlist) return;
  const currentSongIds = playlist.canciones.map((s) => s.id_cancion).filter((id) => id);
  const available = allSongs.filter((s) => !currentSongIds.includes(s.id_cancion));
  const uniqueAvailable = [];
  const seenIds = new Set();
  for (const song of available) {
    if (song.id_cancion && !seenIds.has(song.id_cancion)) {
      seenIds.add(song.id_cancion);
      uniqueAvailable.push(song);
    }
  }
  const optionsHtml =
    uniqueAvailable.length > 0
      ? `<option value="" disabled selected>-- Elige una canción de tu biblioteca --</option>` +
        uniqueAvailable
          .map((song, idx) => `<option value="${idx}">${escapeHtml(song.trackTitle)} - ${escapeHtml(song.artistName)}</option>`)
          .join("")
      : `<option value="" disabled selected>-- No hay más canciones disponibles en tu biblioteca --</option>`;
  const isBtnDisabled = uniqueAvailable.length === 0 ? "disabled style='opacity:0.5; cursor:not-allowed;'" : "";
  container.innerHTML = `
    <div class="playlist-inline-adder">
      <div class="adder-header">
        <i data-lucide="plus-circle" class="adder-icon"></i>
        <div>
          <h4>Añadir Canción a la Playlist</h4>
          <p>Agrega pistas de tu catálogo directamente a esta playlist</p>
        </div>
      </div>
      <div class="adder-body">
        <select id="inlineSongSelector" class="adder-select">${optionsHtml}</select>
        <button id="btnInlineAddSong" class="btn-adder-add" ${isBtnDisabled}>
          <i data-lucide="plus" style="width:14px; height:14px;"></i> Agregar Pista
        </button>
      </div>
    </div>
  `;
  const select = container.querySelector("#inlineSongSelector");
  const btn = container.querySelector("#btnInlineAddSong");
  if (btn && select && uniqueAvailable.length > 0) {
    btn.addEventListener("click", async () => {
      const val = select.value;
      if (val === "") {
        await showAlert("Selecciona una canción.", "Ninguna opción");
        return;
      }
      const item = uniqueAvailable[parseInt(val, 10)];
      if (item && item.id_cancion) {
        try {
          await addSongToPlaylist(playlist.id_playlist, item.id_cancion);
          await refreshUI();
          if (state.activePlaylistName === playlistName) {
            renderPlaylistDetailView(playlistName);
          }
        } catch (err) {
          console.error(err);
          await showAlert("Error de conexión", "Error");
        }
      }
    });
  }
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// RENDER TRACK ACTIVE STYLINGS
// ============================================================
export function renderTrackActiveStylings() {
  const rows = document.querySelectorAll(".track-row");
  if (rows.length === 0) return;

  const currentSong = queueManager.getCurrentSong();
  if (!currentSong) {
    rows.forEach((row) => row.classList.remove("active-track"));
    return;
  }

  const activeTitle = currentSong.trackTitle;
  rows.forEach((row) => {
    const titleEl = row.querySelector(".track-title");
    const titleText = titleEl?.innerText;
    if (titleText === activeTitle) {
      row.classList.add("active-track");
    } else {
      row.classList.remove("active-track");
    }
  });
}

// ============================================================
// CLOSE ALBUM VIEW
// ============================================================
export function closeAlbumView() {
  if (state.fromExplore) {
    showSection("explore");
    state.fromExplore = false;
  } else {
    showSection("home");
  }
}

function playNewAlbumQueue(albumIdx, songIdx) {
  const albums = getAlbums();
  const album = albums[albumIdx];
  if (!album) return;
  setQueue(
    album.songs.map((song) => ({
      ...song,
      artistName: song.artistName || album.artist,
      albumCover: song.albumCover || album.cover,
      originalAlbumIdx: albumIdx,
    })),
    songIdx,
  );
  playActiveSong();
}

// ============================================================
// MENÚ CONTEXTUAL: Añadir a cola o a playlist
// ============================================================
export function addContextSongToQueue() {
  if (!contextMenuSong) return;
  queueManager.addUserQueue(contextMenuSong);
  DOM.contextMenu.container?.classList.add("hidden");
}

export async function addContextSongToSpecificPlaylist(playlistName) {
  if (!contextMenuSong) return;
  const playlist = state.playlists[playlistName];
  if (playlist && contextMenuSong.id_cancion) {
    try {
      await addSongToPlaylist(playlist.id_playlist, contextMenuSong.id_cancion);
      await refreshUI();
      if (state.activePlaylistName === playlistName) {
        renderPlaylistDetailView(playlistName);
      }
    } catch (err) {
      console.error(err);
      await showAlert("Error de conexión", "Error");
    }
  }
  DOM.contextMenu.container?.classList.add("hidden");
}

export function openContextMenuAt(e, song, songIndex, albumIdx) {
  e.preventDefault();
  const albums = getAlbums();
  const album = albums[albumIdx];
  contextMenuSong = {
    ...song,
    id_cancion: song.id_cancion,
    artistName: song.artistName || (album ? album.artist : "Varios Artistas"),
    albumCover: song.albumCover || (album ? album.cover : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400"),
    originalAlbumIdx: albumIdx,
  };

  DOM.contextMenu.container.classList.remove("hidden");
  let targetX = e.clientX,
    targetY = e.clientY;
  const rightPadding = 240,
    bottomPadding = 300;
  if (targetX + rightPadding > window.innerWidth) targetX = window.innerWidth - rightPadding;
  if (targetY + bottomPadding > window.innerHeight) targetY = window.innerHeight - bottomPadding;
  DOM.contextMenu.container.style.left = `${targetX}px`;
  DOM.contextMenu.container.style.top = `${targetY}px`;

  DOM.contextMenu.playlistsList.innerHTML = "";
  const names = Object.keys(state.playlists);
  if (names.length === 0) {
    DOM.contextMenu.playlistsList.innerHTML = `<span style="padding:4px 12px; font-size:12px; color:var(--text-secondary);">Ninguna playlist creada</span>`;
  } else {
    names.forEach((pName) => {
      const opt = document.createElement("button");
      opt.className = "context-option";
      opt.style.fontSize = "12px";
      opt.style.padding = "6px 12px";
      opt.setAttribute("data-playlist-name", pName);
      opt.innerHTML = `<i data-lucide="plus-circle" style="width:14px;"></i> ${escapeHtml(pName)}`;
      DOM.contextMenu.playlistsList.appendChild(opt);
    });
  }
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// ACTUALIZAR UI DE REPRODUCCIÓN
// ============================================================
export function updatePlayingUIs(playing) {
  const song = queueManager.getCurrentSong();

  if (!song) {
    if (DOM.miniPlayer.container) DOM.miniPlayer.container.classList.add("hidden");
    if (DOM.fullPlayer.title) DOM.fullPlayer.title.innerText = "";
    if (DOM.fullPlayer.artist) DOM.fullPlayer.artist.innerHTML = "";
    if (DOM.fullPlayer.cover) DOM.fullPlayer.cover.src = "";

    if (DOM.audioControls.btnPlay) DOM.audioControls.btnPlay.innerHTML = `<i data-lucide="play"></i>`;
    if (DOM.miniPlayer.btnPlay) DOM.miniPlayer.btnPlay.innerHTML = `<i data-lucide="play"></i>`;

    renderQueueSidebarList();
    renderTrackActiveStylings();
    return;
  }

  if (DOM.miniPlayer.container) DOM.miniPlayer.container.classList.remove("hidden");
  if (DOM.miniPlayer.cover) DOM.miniPlayer.cover.src = song.albumCover;
  if (DOM.miniPlayer.title) DOM.miniPlayer.title.innerText = song.trackTitle;
  if (DOM.miniPlayer.artist) DOM.miniPlayer.artist.innerText = song.artistName;

  if (DOM.fullPlayer.cover) DOM.fullPlayer.cover.src = song.albumCover;
  if (DOM.fullPlayer.title) DOM.fullPlayer.title.innerText = song.trackTitle;

  if (DOM.fullPlayer.artist) {
    DOM.fullPlayer.artist.innerHTML = "";
    const artistSpan = document.createElement("span");
    artistSpan.textContent = song.artistName;
    artistSpan.style.cursor = "pointer";
    artistSpan.style.transition = "color 0.2s ease";
    artistSpan.style.fontWeight = "600";
    artistSpan.className = "fullplayer-artist-clickable";
    artistSpan.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.minimizeFullPlayer) window.minimizeFullPlayer();
      if (window.openArtistProfile && song.artistName) {
        window.openArtistProfile(song.artistName);
      }
    });
    DOM.fullPlayer.artist.appendChild(artistSpan);
  }

  if (playing) {
    if (DOM.audioControls.btnPlay) DOM.audioControls.btnPlay.innerHTML = `<i data-lucide="pause"></i>`;
    if (DOM.miniPlayer.btnPlay) DOM.miniPlayer.btnPlay.innerHTML = `<i data-lucide="pause"></i>`;
  } else {
    if (DOM.audioControls.btnPlay) DOM.audioControls.btnPlay.innerHTML = `<i data-lucide="play"></i>`;
    if (DOM.miniPlayer.btnPlay) DOM.miniPlayer.btnPlay.innerHTML = `<i data-lucide="play"></i>`;
  }

  const isFav = state.favorites.some((s) => s.id_cancion === song.id_cancion);
  if (DOM.fullPlayer.btnFavorite) {
    DOM.fullPlayer.btnFavorite.classList.toggle("is-favorite", isFav);
    DOM.fullPlayer.btnFavorite.innerHTML = isFav ? `<i data-lucide="heart" fill="currentColor"></i>` : `<i data-lucide="heart"></i>`;
  }

  renderQueueSidebarList();
  renderTrackActiveStylings();
  renderReviews(song);
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// SIDEBAR MÓVIL
// ============================================================
export function initMobileSidebar() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebarLeft");
  const overlay = document.getElementById("sidebarOverlay");

  if (!hamburgerBtn || !sidebar || !overlay) {
    console.warn("Elementos del sidebar móvil no encontrados");
    return;
  }

  function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  hamburgerBtn.addEventListener("click", openSidebar);
  overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768 && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  document.querySelectorAll(".menu-item, .playlist-link").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  return { openSidebar, closeSidebar };
}

// ============================================================
// EXPORTACIONES ADICIONALES
// ============================================================
window.renderPlaylistDetailView = renderPlaylistDetailView;

export function renderProfileAlbums() {
  const container = document.getElementById("profileAlbumGrid");
  if (!container) return;
  container.innerHTML = "";

  const albums = getAlbums();
  if (albums.length === 0) {
    container.innerHTML = `
            <div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-secondary);">
                <i data-lucide="music" style="width:40px; height:40px; margin-bottom:12px; opacity:0.3; display:block; margin-left:auto; margin-right:auto;"></i>
                <h4 style="color:var(--text-primary); font-weight:600;">No has añadido ningún álbum</h4>
                <p style="font-size:0.9rem;">Explora el catálogo y añade álbumes a tu biblioteca</p>
            </div>
        `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  albums.forEach((album) => {
    const card = document.createElement("article");
    card.className = "album-card";
    card.innerHTML = `
            <div class="card-media-wrapper">
                <div class="card-media">
                    <img src="${album.cover}" alt="${escapeHtml(album.title)}">
                    <div class="play-hint"><i data-lucide="play"></i></div>
                </div>
                <div class="card-reflection"></div>
                <span class="grid-card-tag tag-album">Álbum</span>
            </div>
            <div class="card-info">
                <h3>${escapeHtml(album.title)}</h3>
                <p>${escapeHtml(album.artist)}</p>
            </div>
        `;

    card.addEventListener("click", () => {
      const albumsList = getAlbums();
      const idx = albumsList.findIndex((a) => a.id_album === album.id_album);
      if (idx !== -1) {
        openAlbumView(idx);
      }
    });

    const playBtn = card.querySelector(".play-hint");
    if (playBtn) {
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const albumsList = getAlbums();
        const idx = albumsList.findIndex((a) => a.id_album === album.id_album);
        if (idx !== -1) {
          playNewAlbumQueue(idx, 0);
        }
      });
    }

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

export { refreshUI };
