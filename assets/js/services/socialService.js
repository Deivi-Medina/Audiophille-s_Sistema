import { post, get } from "../api.js";

export async function addPlaylistToLibraryAPI(playlistId) {
  return post("add_playlist_to_library", { playlist_id: playlistId });
}

export async function mergePlaylistsAPI(friendId) {
  return post("merge_playlists", { friend_id: friendId });
}

export async function checkFriendsAPI(userId) {
  return get("check_friends", { user_id: userId });
}

export async function checkMergedPlaylistAPI(friendId) {
  return get("check_merged_playlist", { friend_id: friendId });
}
