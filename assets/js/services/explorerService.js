// assets/js/services/exploreSongService.js
import { get, post } from "../api.js";

/**
 * Obtiene álbumes públicos que el usuario NO tiene en su biblioteca
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad por página
 * @param {string} search - Término de búsqueda (opcional)
 * @returns {Promise}
 */
export async function getPublicAlbums(page = 1, limit = 20, search = "") {
  const params = { page, limit };
  if (search.trim()) {
    params.search = search.trim();
  }
  return get("get_public_albums", params);
}

/**
 * Añade un álbum a la biblioteca personal del usuario
 * @param {number} albumId - ID del álbum
 * @returns {Promise}
 */
export async function addAlbumToLibrary(albumId) {
  return post("add_album_to_library", { id_album: albumId });
}

/**
 * Elimina un álbum de la biblioteca personal del usuario
 * @param {number} albumId - ID del álbum
 * @returns {Promise}
 */
export async function removeAlbumFromLibrary(albumId) {
  return post("remove_album_from_library", { id_album: albumId });
}

export async function getYouTubeId(cancionId) {
  return await get("get_youtube_id", { id_cancion: cancionId });
}

// Obtener artistas públicos
export async function getPublicArtists(limit = 20, search = "") {
  return await get("get_public_artists", { limit, search });
}
// Seguir o dejar de seguir artista
export async function toggleFollowArtist(artistName, follow) {
  return await post("toggle_follow_artist", {
    artist_name: artistName,
    follow: follow ? "1" : "0",
  });
}

export async function checkYouTubeCache(cancionId) {
  return await get("check_youtube_cache", { id_cancion: cancionId });
}
