// js/album-crud.js
import DOM, { state, loadInitialData } from "./var.js";
import { renderAlbumCards, openAlbumView } from "./ui.js";
import { showSection } from "./navigation.js";
import { openEditPlaylistModal, deleteActivePlaylist } from "./playlist.js";
import { showAlert, showConfirm } from "./modals.js";
import { post } from "./api.js";
import { addXpForAction } from "./achievements.js";

let editAlbumTempSongs = [];
let tempCoverFile = null;

function getAlbums() {
  return window.albumsFromDB || [];
}

async function refreshDataAndUI() {
  await loadInitialData();
  renderAlbumCards();
  if (state.activeAlbumIndex !== null) {
    const albums = getAlbums();
    if (state.activeAlbumIndex < albums.length) {
      openAlbumView(state.activeAlbumIndex);
    } else {
      showSection("home");
    }
  }
}

if (DOM.editAlbumModal?.coverFileInput) {
  DOM.editAlbumModal.coverFileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      tempCoverFile = file;
      const preview = document.getElementById("editCoverPreview");
      if (preview) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          preview.src = ev.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    } else {
      tempCoverFile = null;
      const preview = document.getElementById("editCoverPreview");
      if (preview) {
        preview.src = "";
        preview.style.display = "none";
      }
    }
  });
}

async function updatePlaylist(playlistId, nombre, coverFile, coverUrl, songIds) {
  const formData = new FormData();
  formData.append("action", "update_playlist");
  formData.append("id_playlist", playlistId);
  formData.append("nombre", nombre);

  if (coverFile) {
    formData.append("cover_file", coverFile);
  } else if (coverUrl) {
    formData.append("portada_url", coverUrl);
  }

  formData.append("canciones", JSON.stringify(songIds));

  return post("update_playlist", formData);
}

async function updateAlbum(albumId, titulo, artista, coverFile, coverUrl, songsData) {
  const formData = new FormData();
  formData.append("action", "update_album");
  formData.append("id_album", albumId);
  formData.append("titulo", titulo);
  formData.append("artista", artista);

  if (coverFile) {
    formData.append("cover_file", coverFile);
  } else if (coverUrl) {
    formData.append("caratula", coverUrl);
  }

  formData.append("canciones", JSON.stringify(songsData));

  return post("update_album", formData);
}

async function deleteAlbum(albumId) {
  return post("delete_album", { id_album: albumId });
}

export async function openEditAlbumModal() {
  if (state.activePlaylistName) {
    openEditPlaylistModal();
    tempCoverFile = null;
    const preview = document.getElementById("editCoverPreview");
    if (preview) {
      preview.src = "";
      preview.style.display = "none";
    }
    return;
  }

  const albumIndex = state.activeAlbumIndex;
  if (albumIndex === null) return;
  const albums = getAlbums();
  const album = albums[albumIndex];
  if (!album) return;

  if (album.title === "Mis Archivos Importados" || album.es_importado) {
    await showAlert("Este álbum virtual no se puede editar.", "Información");
    return;
  }

  tempCoverFile = null;
  const preview = document.getElementById("editCoverPreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  if (DOM.editAlbumModal.inputTitle) DOM.editAlbumModal.inputTitle.value = album.title;
  if (DOM.editAlbumModal.inputArtist) DOM.editAlbumModal.inputArtist.value = album.artist;
  if (DOM.editAlbumModal.inputCover) DOM.editAlbumModal.inputCover.value = album.cover;

  editAlbumTempSongs = album.songs.map((s) => ({ ...s }));
  renderEditAlbumSongsList();
  if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.remove("hidden");
}

export function closeEditAlbumModal() {
  if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.add("hidden");
  if (DOM.editAlbumModal.headerTitle) DOM.editAlbumModal.headerTitle.innerText = "Editar Álbum";
  if (DOM.editAlbumModal.lblTitle) DOM.editAlbumModal.lblTitle.innerText = "Título del Álbum";
  if (DOM.editAlbumModal.artistGroup) DOM.editAlbumModal.artistGroup.style.display = "block";
  tempCoverFile = null;
  const preview = document.getElementById("editCoverPreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }
}

export function renderEditAlbumSongsList() {
  const container = DOM.editAlbumModal.songsContainer;
  if (!container) return;
  container.innerHTML = "";
  if (editAlbumTempSongs.length === 0) {
    container.innerHTML = `<span style="padding:10px; font-size:12px; color:var(--text-secondary); text-align:center;">No hay canciones.</span>`;
    return;
  }
  editAlbumTempSongs.forEach((song, idx) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; align-items:center; gap:8px; margin-bottom:6px;";
    row.innerHTML = `
      <span style="font-size:12px; color:var(--text-secondary); width:20px;">${idx + 1}</span>
      <input type="text" value="${song.trackTitle.replace(/"/g, "&quot;")}" placeholder="Título..." style="flex:1; background:#1c1c24; border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:6px 10px; color:#fff; font-size:13px; outline:none;">
      <button class="btn-delete-temp-song" style="background:rgba(255,69,58,0.1); border:none; color:#ff453a; width:28px; height:28px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center;"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
    `;
    const input = row.querySelector("input");
    input.addEventListener("input", (e) => {
      editAlbumTempSongs[idx].trackTitle = e.target.value;
    });
    const btnDel = row.querySelector(".btn-delete-temp-song");
    btnDel.addEventListener("click", () => {
      editAlbumTempSongs.splice(idx, 1);
      renderEditAlbumSongsList();
    });
    container.appendChild(row);
  });
  if (window.lucide) window.lucide.createIcons();
}

export function handleEditAlbumAddLocalSong(file) {
  if (!file) return;
  const fileUrl = URL.createObjectURL(file);
  let rawTitle = file.name;
  const lastDot = rawTitle.lastIndexOf(".");
  if (lastDot > 0) rawTitle = rawTitle.slice(0, lastDot);
  editAlbumTempSongs.push({ trackTitle: rawTitle, file: fileUrl });
  renderEditAlbumSongsList();
}

export async function confirmEditAlbumChanges() {
  if (state.activePlaylistName) {
    const oldName = state.activePlaylistName;
    const nextName = DOM.editAlbumModal.inputTitle?.value.trim();
    if (!nextName) {
      await showAlert("Nombre de playlist requerido.", "Campo vacío");
      return;
    }
    const playlist = state.playlists[oldName];
    if (!playlist) {
      await showAlert("Playlist no encontrada.", "Error");
      return;
    }

    const coverFile = tempCoverFile;
    const coverUrl = DOM.editAlbumModal.inputCover?.value.trim();
    const songIds = editAlbumTempSongs.map((s) => s.id_cancion).filter((id) => id);

    try {
      const data = await updatePlaylist(playlist.id_playlist, nextName, coverFile, coverUrl, songIds);
      if (data.success) {
        await refreshDataAndUI();
        closeEditAlbumModal();
        showSection(`playlist:${nextName}`);
        tempCoverFile = null;
        const preview = document.getElementById("editCoverPreview");
        if (preview) {
          preview.src = "";
          preview.style.display = "none";
        }
      } else {
        await showAlert(data.message || "Error al actualizar playlist", "Error");
      }
    } catch (error) {
      console.error(error);
      await showAlert(error.message || "Error de conexión", "Error");
    }
    return;
  }

  const albumIndex = state.activeAlbumIndex;
  if (albumIndex === null) return;
  const albums = getAlbums();
  const album = albums[albumIndex];
  if (!album) return;

  const nextTitle = DOM.editAlbumModal.inputTitle?.value.trim();
  const nextArtist = DOM.editAlbumModal.inputArtist?.value.trim();
  const nextCover = DOM.editAlbumModal.inputCover?.value.trim();

  if (!nextTitle || !nextArtist) {
    await showAlert("Rellena título y artista.", "Datos incompletos");
    return;
  }

  const coverFile = tempCoverFile;
  const songsData = editAlbumTempSongs.map((s) => ({
    trackTitle: s.trackTitle || "Pista sin título",
    file: s.file,
    id_cancion: s.id_cancion || null,
  }));

  try {
    const data = await updateAlbum(album.id_album, nextTitle, nextArtist, coverFile, nextCover, songsData);
    if (data.success) {
      await refreshDataAndUI();
      closeEditAlbumModal();
      const newAlbums = getAlbums();
      const newIndex = newAlbums.findIndex((a) => a.id_album === album.id_album);
      if (newIndex !== -1) openAlbumView(newIndex);
      tempCoverFile = null;
      const preview = document.getElementById("editCoverPreview");
      if (preview) {
        preview.src = "";
        preview.style.display = "none";
      }
    } else {
      await showAlert(data.message || "Error al guardar cambios", "Error");
    }
  } catch (error) {
    console.error(error);
    await showAlert(error.message || "Error de conexión", "Error");
  }
}

export async function deleteActiveAlbum() {
  if (state.activePlaylistName) {
    await deleteActivePlaylist();
    return;
  }
  const albumIndex = state.activeAlbumIndex;
  if (albumIndex === null) return;
  const albums = getAlbums();
  const album = albums[albumIndex];
  if (!album) return;
  if (album.title === "Mis Archivos Importados" || album.es_importado) {
    await showAlert("No se puede eliminar este álbum virtual.", "Operación no permitida");
    return;
  }
  const confirmed = await showConfirm(`¿Eliminar álbum "${album.title}"?`, "Eliminar álbum", "Eliminar", "Cancelar", true);
  if (confirmed) {
    try {
      const data = await deleteAlbum(album.id_album);
      if (data.success) {
        await refreshDataAndUI();
        showSection("home");
      } else {
        await showAlert(data.message || "Error al eliminar", "Error");
      }
    } catch (error) {
      await showAlert(error.message || "Error de conexión", "Error");
    }
  }
}
