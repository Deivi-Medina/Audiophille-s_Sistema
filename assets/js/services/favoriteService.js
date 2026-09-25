import { post } from "../api.js";

export async function toggleFavorite(idCancion) {
  return post("toggle_favorite", { id_cancion: idCancion });
}
