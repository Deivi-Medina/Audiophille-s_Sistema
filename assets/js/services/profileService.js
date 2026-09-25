import { get } from "../api.js";

export async function getPublicProfile(userId) {
  return get("get_public_profile", { user_id: userId });
}
