// assets/js/services/gameService.js
import { post } from "../api.js";

export async function incrementarPartida() {
  return post("incrementar_partida", {});
}
