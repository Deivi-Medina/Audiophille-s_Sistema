// assets/js/services/artistService.js
import { post } from "../api.js";

/**
 * Seguir o dejar de seguir a un artista
 * @param {string} artistName - Nombre del artista
 * @param {boolean} follow - true para seguir, false para dejar de seguir
 * @returns {Promise<boolean>} - true si éxito, false si falla
 */
export async function toggleFollowArtist(artistName, follow) {
  const data = await post("toggle_follow_artist", {
    artist_name: artistName,
    follow: follow ? "1" : "0",
  });
  return data.success;
}
