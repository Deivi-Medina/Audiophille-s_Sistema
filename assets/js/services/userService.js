import { get, post } from "../api.js";

export async function getUserProfile() {
  return get("get_user_profile");
}

export async function getUserStats() {
  return get("get_user_stats");
}

export async function updateUserProfile(username, email, password, avatarFile) {
  const formData = new FormData();
  formData.append("action", "update_user_profile");
  formData.append("username", username);
  formData.append("email", email);
  if (password) {
    formData.append("password", password);
  }
  if (avatarFile) {
    formData.append("avatar", avatarFile);
  }
  return post("update_user_profile", formData);
}
