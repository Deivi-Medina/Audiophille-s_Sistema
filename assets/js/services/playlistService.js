// assets/js/services/playlistService.js
import { post } from "../api.js";

export async function createPlaylist(nombre, portadaFile) {
  const formData = new FormData();
  formData.append("action", "create_playlist");
  formData.append("nombre", nombre);
  if (portadaFile) {
    formData.append("portada_file", portadaFile);
  }
  return post("create_playlist", formData);
}

export async function updatePlaylist(idPlaylist, nombre, coverFile, coverUrl, songIds) {
  const formData = new FormData();
  formData.append("action", "update_playlist");
  formData.append("id_playlist", idPlaylist);
  formData.append("nombre", nombre);
  if (coverFile) {
    formData.append("cover_file", coverFile);
  } else if (coverUrl) {
    formData.append("portada_url", coverUrl);
  }
  formData.append("canciones", JSON.stringify(songIds));
  return post("update_playlist", formData);
}

export async function deletePlaylist(idPlaylist) {
  return post("delete_playlist", { id_playlist: idPlaylist });
}

// ============================================================
// NUEVA FUNCIÓN PARA ui.js
// ============================================================
export async function addSongToPlaylist(playlistId, songId) {
  return post("add_to_playlist", {
    id_playlist: playlistId,
    id_cancion: songId,
  });
}
