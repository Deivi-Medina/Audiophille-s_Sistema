import { get } from "../api.js";

export async function getFeed(limit, offset, filter) {
  return get("get_feed", {
    limit: limit,
    offset: offset,
    filter: filter,
  });
}
