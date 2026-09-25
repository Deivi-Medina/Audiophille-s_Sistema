import { get, post } from "../api.js";

export async function getReviews() {
  return get("get_reviews");
}

export async function saveReview(idCancion, puntuacion, comentario, rewatch, tituloTexto, artistaTexto) {
  const formData = new FormData();
  formData.append("action", "save_review");
  formData.append("id_cancion", idCancion);
  formData.append("puntuacion", puntuacion);
  formData.append("comentario", comentario);
  formData.append("rewatch", rewatch ? "1" : "0");
  formData.append("titulo_texto", tituloTexto);
  formData.append("artista_texto", artistaTexto);
  return post("save_review", formData);
}

export async function deleteReview(idReview) {
  return post("delete_review", { id_review: idReview });
}

export async function updateReview(idReview, puntuacion, comentario, rewatch) {
  return post("update_review", {
    id_review: idReview,
    puntuacion: puntuacion,
    comentario: comentario,
    rewatch: rewatch ? "1" : "0",
  });
}

export async function getTopArtist() {
  return get("get_top_artist");
}
