import { get, post } from "../api.js";

export function getAchievements() {
  return get("get_achievements");
}

export function updateXp(xp, actionType) {
  return post("update_xp", { xp, action_type: actionType });
}

export function unlockAchievement(idLogro) {
  return post("unlock_achievement", { id_logro: idLogro });
}
