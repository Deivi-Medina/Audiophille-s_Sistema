// assets/js/services/playStatsService.js
import { post } from "../api.js";
export async function registerPlay(track) {
  if (!track) return;
  const artistName = track.artistName || "Artista Desconocido";
  const payload = {
    nombre_artista: artistName,
  };
  if (track.id_artista) {
    payload.id_artista = track.id_artista;
  }
  try {
    const data = await post("register_play", payload);
    return data; // <--- esto es lo nuevo
  } catch (error) {
    console.warn("Error al registrar reproducción:", error);
    return null;
  }
}
