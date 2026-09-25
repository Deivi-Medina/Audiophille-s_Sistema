// assets/js/social/follow.js
import {
  toggleFollowUser as toggleFollowUserService,
  getFollowers as getFollowersService,
  getFollowing as getFollowingService,
  isFollowing as isFollowingService,
} from "../services/followService.js";
import { addXpForAction } from "../achievements.js";

export async function toggleFollowUser(userId, btnElement = null) {
  try {
    const data = await toggleFollowUserService(userId);

    if (data.success) {
      if (btnElement) {
        updateFollowButton(btnElement, data.following);
      }

      if (data.following) {
        addXpForAction("follow");
      }

      document.dispatchEvent(
        new CustomEvent("follow-updated", {
          detail: { userId, following: data.following },
        }),
      );
      return data.following;
    } else {
      console.error("Error al seguir usuario:", data.message);
      return false;
    }
  } catch (error) {
    console.error("Error de red al seguir usuario:", error);
    return false;
  }
}

export function updateFollowButton(btn, isFollowing) {
  if (isFollowing) {
    btn.textContent = "Dejar de seguir";
    btn.classList.add("following");
    const icon = btn.querySelector("i");
    if (icon) icon.setAttribute("data-lucide", "user-minus");
  } else {
    btn.textContent = "Seguir";
    btn.classList.remove("following");
    const icon = btn.querySelector("i");
    if (icon) icon.setAttribute("data-lucide", "user-plus");
  }
  if (window.lucide) window.lucide.createIcons();
}

export async function getFollowers(userId) {
  try {
    const data = await getFollowersService(userId);
    return data.success ? data.followers : [];
  } catch (error) {
    console.error("Error al obtener seguidores:", error);
    return [];
  }
}

export async function getFollowing(userId) {
  try {
    const data = await getFollowingService(userId);
    return data.success ? data.following : [];
  } catch (error) {
    console.error("Error al obtener seguidos:", error);
    return [];
  }
}

export async function isFollowing(userId) {
  try {
    const data = await isFollowingService(userId);
    return data.success && data.is_following;
  } catch (error) {
    console.error("Error al verificar seguimiento:", error);
    return false;
  }
}
