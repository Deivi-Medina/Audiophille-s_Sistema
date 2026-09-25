// js/playlist.js
import DOM, { state, loadInitialData } from "./var.js";
import { showSection } from "./navigation.js";
import { renderAlbumCards } from "./ui.js";
import { setQueue, playActiveSong } from "./audio.js";
import { showAlert, showConfirm } from "./modals.js";
import { createPlaylist, updatePlaylist, deletePlaylist } from "./services/playlistService.js";
import { addXpForAction } from "./achievements.js";
import { updateDiarySongsSelector } from "./reviews.js";

window.tempCoverFile = null;

// ============================================================
// FUNCIONES AUXILIARES
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

async function refreshUI() {
  await loadInitialData();
  renderPlaylistsSidebarLinks();
  renderAlbumCards();
  updateDiarySongsSelector();
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// RENDERIZAR ENLACES DE PLAYLISTS EN SIDEBAR
// ============================================================
export function renderPlaylistsSidebarLinks() {
  if (!DOM.sidebar.playlistsContainer) return;
  DOM.sidebar.playlistsContainer.innerHTML = "";
  const playlists = state.playlists || {};
  Object.keys(playlists).forEach((pName) => {
    const playlist = playlists[pName];
    const link = document.createElement("button");
    link.className = "playlist-link";
    link.dataset.name = pName;
    link.innerHTML = `<i data-lucide="music"></i> <span>${escapeHtml(pName)}</span>`;

    // Separar eventos click y dblclick con temporizador
    let clickTimer = null;
    link.addEventListener("click", () => {
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        showSection(`playlist:${pName}`);
      }, 200);
    });
    link.addEventListener("dblclick", async () => {
      clearTimeout(clickTimer);
      const songs = playlist.canciones || [];
      if (songs.length > 0) {
        setQueue(
          songs.map((song) => ({
            ...song,
            artistName: song.artistName || "Playlist",
            albumCover: song.albumCover || playlist.portada,
            originalAlbumIdx: song.originalAlbumIdx,
          })),
          0,
        );
        // ✅ Iniciar reproducción después de establecer la cola
        await playActiveSong();
      } else {
        await showAlert("Esta playlist no tiene canciones.", "Playlist vacía");
      }
    });

    DOM.sidebar.playlistsContainer.appendChild(link);
  });
  if (window.lucide) window.lucide.createIcons();
}

// ============================================================
// MODAL DE CREACIÓN DE PLAYLIST
// ============================================================
export function openPlaylistModal() {
  if (DOM.modal.overlay) DOM.modal.overlay.classList.remove("hidden");
  if (DOM.modal.input) DOM.modal.input.value = "";
  if (DOM.modal.imgInput) DOM.modal.imgInput.value = "";
  setTimeout(() => DOM.modal.input?.focus(), 100);
}

export function closePlaylistModal() {
  if (DOM.modal.overlay) DOM.modal.overlay.classList.add("hidden");
}

// ============================================================
// ACCIÓN DE CREAR PLAYLIST (con manejo de errores)
// ============================================================
export async function createPlaylistAction() {
  const pName = DOM.modal.input?.value.trim();
  if (!pName) {
    await showAlert("Escribe un nombre para la playlist.", "Campo vacío");
    return;
  }
  if (state.playlists && state.playlists[pName]) {
    await showAlert(`Ya existe una playlist llamada "${pName}". Elige otro nombre.`, "Nombre duplicado");
    return;
  }
  const file = DOM.modal.imgInput?.files[0];

  try {
    const data = await createPlaylist(pName, file);
    if (data.success) {
      await refreshUI();
      closePlaylistModal();
      try {
        await addXpForAction("playlist");
      } catch (xpError) {
        console.warn("Error al añadir XP:", xpError);
      }
      await showAlert(`Playlist "${pName}" creada exitosamente.`, "Éxito", "success");
    } else {
      await showAlert(data.message || "Error al crear la playlist", "Error");
    }
  } catch (error) {
    console.error("Error en createPlaylistAction:", error);
    closePlaylistModal();
    if (error.message === "No autorizado" || error.message.includes("autorizado")) {
      await showAlert("Tu sesión ha expirado. Por favor, recarga la página para continuar.", "Sesión expirada");
      window.location.reload();
    } else {
      await showAlert(error.message || "Error de conexión al crear la playlist", "Error");
    }
  }
}

// ============================================================
// ABRIR MODAL DE EDICIÓN DE PLAYLIST
// ============================================================
export async function openEditPlaylistModal() {
  const playlistName = state.activePlaylistName;
  if (!playlistName) {
    await showAlert("No hay una playlist activa para editar.", "Error");
    return;
  }
  const playlist = state.playlists[playlistName];
  if (!playlist) {
    await showAlert("La playlist no existe.", "Error");
    return;
  }

  window.tempCoverFile = null;
  const preview = document.getElementById("editCoverPreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  // Configurar el modal para editar playlist
  if (DOM.editAlbumModal.headerTitle) DOM.editAlbumModal.headerTitle.innerText = "Editar Playlist";
  if (DOM.editAlbumModal.lblTitle) DOM.editAlbumModal.lblTitle.innerText = "Nombre de la Playlist";
  if (DOM.editAlbumModal.artistGroup) DOM.editAlbumModal.artistGroup.style.display = "none";
  if (DOM.editAlbumModal.inputTitle) DOM.editAlbumModal.inputTitle.value = playlistName;
  if (DOM.editAlbumModal.inputCover) DOM.editAlbumModal.inputCover.value = playlist.portada || "";

  window.editPlaylistTempSongs = (playlist.canciones || []).map((s) => ({ ...s }));
  if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.remove("hidden");
}

// ============================================================
// CONFIRMAR CAMBIOS DE EDICIÓN DE PLAYLIST
// ============================================================
export async function confirmEditPlaylistChanges(oldName, nextName, nextCover, tempSongs, coverFile = null) {
  const playlist = state.playlists[oldName];
  if (!playlist) {
    await showAlert("La playlist original no existe.", "Error");
    return;
  }
  const playlistId = playlist.id_playlist;
  if (!playlistId) {
    await showAlert("Error: playlist sin ID", "Error");
    return;
  }

  const coverFileToSend = coverFile || window.tempCoverFile || null;
  const songIds = tempSongs.map((s) => s.id_cancion).filter((id) => id);

  try {
    const data = await updatePlaylist(playlistId, nextName, coverFileToSend, nextCover, songIds);
    if (data.success) {
      await refreshUI();
      showSection(`playlist:${nextName}`);
      if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.add("hidden");
      window.tempCoverFile = null;
      const preview = document.getElementById("editCoverPreview");
      if (preview) {
        preview.src = "";
        preview.style.display = "none";
      }
      await showAlert(`Playlist "${nextName}" actualizada correctamente.`, "Éxito", "success");
    } else {
      await showAlert(data.message || "Error al actualizar playlist", "Error");
    }
  } catch (error) {
    console.error("Error en confirmEditPlaylistChanges:", error);
    if (error.message === "No autorizado" || error.message.includes("autorizado")) {
      await showAlert("Tu sesión ha expirado. Recarga la página.", "Sesión expirada");
      window.location.reload();
    } else {
      await showAlert(error.message || "Error de conexión", "Error");
    }
  }
}

// ============================================================
// ELIMINAR PLAYLIST ACTIVA
// ============================================================
export async function deleteActivePlaylist() {
  const playlistName = state.activePlaylistName;
  if (!playlistName) {
    await showAlert("No hay una playlist activa para eliminar.", "Error");
    return;
  }
  const playlist = state.playlists[playlistName];
  if (!playlist) {
    await showAlert("La playlist ya no existe.", "Error");
    return;
  }
  const playlistId = playlist.id_playlist;
  if (!playlistId) {
    await showAlert("Error: playlist sin ID", "Error");
    return;
  }

  const confirmed = await showConfirm(
    `¿Eliminar playlist "${playlistName}"? Esta acción no se puede deshacer.`,
    "Eliminar playlist",
    "Eliminar",
    "Cancelar",
    true,
  );
  if (!confirmed) return;

  try {
    const data = await deletePlaylist(playlistId);
    if (data.success) {
      await refreshUI();
      showSection("home");
      await showAlert(`Playlist "${playlistName}" eliminada.`, "Eliminada", "info");
    } else {
      await showAlert(data.message || "Error al eliminar playlist", "Error");
    }
  } catch (error) {
    console.error("Error en deleteActivePlaylist:", error);
    if (error.message === "No autorizado" || error.message.includes("autorizado")) {
      await showAlert("Tu sesión ha expirado. Recarga la página.", "Sesión expirada");
      window.location.reload();
    } else {
      await showAlert(error.message || "Error de conexión", "Error");
    }
  }
}
