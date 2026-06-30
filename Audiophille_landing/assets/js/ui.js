// js/ui.js
import DOM, { state, preloadDurations, loadInitialData } from "./var.js";
import { queue, queueIndex, playActiveSong, setQueue, reorderQueue } from "./audio.js";
import { renderReviews } from "./reviews.js";
import { showSection } from "./navigation.js";
import { showAlert } from "./modals.js";
import { openArtistProfile } from "./artists.js";
import { addSongToPlaylist } from "./services/playlistService.js";

let contextMenuSong = null;
let draggedIndex = null;
let dragOverIndex = null;

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

export function openAlbumView(idx) {
  if (DOM.views.artistProfile) DOM.views.artistProfile.classList.add("hidden");

  state.activeAlbumIndex = idx;
  state.activePlaylistName = null;
  state.currentSection = "home";
  if (DOM.extra.playlistInlineContainer) DOM.extra.playlistInlineContainer.classList.add("hidden");
  if (DOM.views.library) DOM.views.library.classList.add("hidden");
  if (DOM.views.albumDetail) DOM.views.albumDetail.classList.remove("hidden");

  const albums = getAlbums();
  const album = albums[idx];
  if (!album) return;

  if (DOM.currentAlbumDetail.cover) DOM.currentAlbumDetail.cover.src = album.cover;
  if (DOM.currentAlbumDetail.title) DOM.currentAlbumDetail.title.innerText = album.title;

  if (DOM.currentAlbumDetail.artist) {
    const artistSpan = document.createElement("span");
    artistSpan.className = "artist-clickable";
    artistSpan.textContent = album.artist;
    artistSpan.style.cursor = "pointer";
    artistSpan.style.color = "var(--text-secondary)";
    artistSpan.style.transition = "color 0.2s";
    artistSpan.addEventListener("mouseenter", () => (artistSpan.style.color = "var(--text-primary)"));
    artistSpan.addEventListener("mouseleave", () => (artistSpan.style.color = "var(--text-secondary)"));
    artistSpan.addEventListener("click", (e) => {
      e.stopPropagation();
      openArtistProfile(album.artist);
    });
    DOM.currentAlbumDetail.artist.innerHTML = "";
    DOM.currentAlbumDetail.artist.appendChild(artistSpan);
  }

  if (DOM.albumActions.row) {
    DOM.albumActions.row.style.display = album.title === "Mis Archivos Importados" ? "none" : "flex";
  }
  if (DOM.albumActions.btnEdit) {
    DOM.albumActions.btnEdit.innerHTML = `<i data-lucide="pencil" style="width:14px; height:14px;"></i> Editar Álbum`;
  }
  if (DOM.albumActions.btnDelete) {
    DOM.albumActions.btnDelete.innerHTML = `<i data-lucide="trash-2" style="width:14px; height:14px;"></i> Eliminar Álbum`;
  }

  if (DOM.views.tracksList) DOM.views.tracksList.innerHTML = "";
  album.songs.forEach((song, songIdx) => {
    const activeClass = queue.length > 0 && queue[queueIndex]?.file === song.file ? "active-track" : "";
    const row = document.createElement("div");
    row.className = `track-row ${activeClass}`;
    row.innerHTML = `
      <span class="track-number">${songIdx + 1}</span>
      <span class="track-title">${escapeHtml(song.trackTitle)}</span>
      <span class="track-album-inside">${escapeHtml(album.title)}</span>
      <span class="track-duration">--:--</span>
      <button class="btn-track-actions"><i data-lucide="more-horizontal"></i></button>
    `;
    row.addEventListener("click", () => playNewAlbumQueue(idx, songIdx));
    const btnActions = row.querySelector(".btn-track-actions");
    btnActions.addEventListener("click", (e) => {
      e.stopPropagation();
      openContextMenuAt(e, song, songIdx, idx);
    });
    if (DOM.views.tracksList) DOM.views.tracksList.appendChild(row);
  });
  preloadDurations(album.songs, DOM.views.tracksList);
  if (window.lucide) window.lucide.createIcons();
}

export function closeAlbumView() {
  showSection("home");
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

export function renderQueueSidebarList() {
  if (!DOM.queue.dynamicList) return;
  const container = DOM.queue.dynamicList;
  container.innerHTML = "";

  queue.forEach((song, idx) => {
    const item = document.createElement("div");
    item.className = `queue-item ${idx === queueIndex ? "queue-active" : ""}`;
    item.draggable = true;
    item.dataset.index = idx;

    item.innerHTML = `
      <div class="queue-title">${escapeHtml(song.trackTitle)}</div>
      <div class="queue-artist">${escapeHtml(song.artistName)}</div>
    `;

    // Eventos de drag & drop
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragenter", handleDragEnter);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);

    // Click para reproducir
    item.addEventListener("click", () => {
      setQueue(queue, idx);
      playActiveSong();
    });

    container.appendChild(item);
  });
}

// ==================== MANEJADORES DE DRAG & DROP ====================

function handleDragStart(e) {
  draggedIndex = parseInt(this.dataset.index);
  this.style.opacity = "0.5";
  e.dataTransfer.effectAllowed = "move";
  // Opcional: guardar el índice en dataTransfer para mayor robustez
  e.dataTransfer.setData("text/plain", String(draggedIndex));
}

function handleDragEnter(e) {
  e.preventDefault();
  this.classList.add("drag-over");
}

function handleDragOver(e) {
  e.preventDefault(); // Necesario para permitir drop
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove("drag-over");

  const targetIndex = parseInt(this.dataset.index);
  // Usar draggedIndex (variable global) o el valor de dataTransfer
  const fromIndex = draggedIndex !== null ? draggedIndex : parseInt(e.dataTransfer.getData("text/plain"));

  if (fromIndex !== null && targetIndex !== null && fromIndex !== targetIndex) {
    // Reordenar la cola
    reorderQueue(fromIndex, targetIndex);
    // Refrescar la vista
    renderQueueSidebarList();
  }

  // Limpiar estado
  draggedIndex = null;
  dragOverIndex = null;
}

function handleDragEnd(e) {
  this.style.opacity = "1";
  document.querySelectorAll(".queue-item").forEach((el) => el.classList.remove("drag-over"));
  draggedIndex = null;
  dragOverIndex = null;
}

export function renderTrackActiveStylings() {
  const rows = document.querySelectorAll(".track-row");
  if (queue.length === 0) return;
  const activeSong = queue[queueIndex];
  rows.forEach((row) => {
    const titleText = row.querySelector(".track-title")?.innerText;
    if (titleText === activeSong.trackTitle) row.classList.add("active-track");
    else row.classList.remove("active-track");
  });
}

export function renderFavoritesDetailView() {
  if (DOM.currentAlbumDetail.cover) {
    DOM.currentAlbumDetail.cover.src = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
  }
  if (DOM.currentAlbumDetail.title) DOM.currentAlbumDetail.title.innerText = "Mis Favoritos";
  if (DOM.currentAlbumDetail.artist) DOM.currentAlbumDetail.artist.innerText = "Tus canciones con corazones";
  if (DOM.views.tracksList) DOM.views.tracksList.innerHTML = "";
  state.favorites.forEach((song, songIdx) => {
    const activeClass = queue.length > 0 && queue[queueIndex]?.file === song.file ? "active-track" : "";
    const row = document.createElement("div");
    row.className = `track-row ${activeClass}`;
    row.innerHTML = `
      <span class="track-number"><i data-lucide="heart" style="color:#ff2d55; width:14px; fill:#ff2d55;"></i></span>
      <span class="track-title">${escapeHtml(song.trackTitle)}</span>
      <span class="track-album-inside">${escapeHtml(song.artistName)}</span>
      <span class="track-duration">--:--</span>
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
    const activeClass = queue.length > 0 && queue[queueIndex]?.file === song.file ? "active-track" : "";
    const row = document.createElement("div");
    row.className = `track-row ${activeClass}`;
    row.innerHTML = `
      <span class="track-number">${songIdx + 1}</span>
      <span class="track-title">${escapeHtml(song.trackTitle)}</span>
      <span class="track-album-inside">${escapeHtml(song.artistName)}</span>
      <span class="track-duration">--:--</span>
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

export function addContextSongToQueue() {
  if (!contextMenuSong) return;
  const newQueue = [...queue, contextMenuSong];
  setQueue(newQueue, queueIndex);
  if (queue.length === 1) playActiveSong();
  else renderQueueSidebarList();
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

export function updatePlayingUIs(playing) {
  if (queue.length === 0) return;
  const song = queue[queueIndex];
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
      if (window.minimizeFullPlayer) {
        window.minimizeFullPlayer();
      }
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

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

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

window.renderPlaylistDetailView = renderPlaylistDetailView;

export { refreshUI };
