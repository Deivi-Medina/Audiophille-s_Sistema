import { get } from "../api.js";

export async function getExploreUsers(search, limit, offset, filter) {
  const params = {
    action: "explore_users",
    limit: limit,
    offset: offset,
    filter: filter,
  };
  if (search) {
    params.search = search;
  }
  return get("explore_users", params);
}
