import { get, post } from "../api.js";

export async function toggleFollowUser(userId) {
  return post("toggle_follow_user", { user_id: userId });
}

export async function getFollowers(userId) {
  return get("get_followers", { user_id: userId });
}

export async function getFollowing(userId) {
  return get("get_following", { user_id: userId });
}

export async function isFollowing(userId) {
  return get("is_following", { user_id: userId });
}
