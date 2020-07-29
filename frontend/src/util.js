import { Object_assign as assign } from "@hydrophobefireman/j-utils";
const isDev = location.host.includes("localhost");

const baseURL = `${location.protocol}//${
  isDev ? "localhost:5000" : "sreddit-api.herokuapp.com"
}`;

const getURL = (url) => new URL(url, baseURL).toString();
export const requests = {
  /**
   * @param {string} url
   * @param {RequestInit} args

   */
  get(url, args) {
    return fetch(getURL(url), assign(args || {}, { method: "get" }));
  },
  /**
   * @param {string} url
   * @param {RequestInit} args
   */
  post(url, args) {
    fetch(getURL(url), assign(args || {}, { method: "post" }));
  },
};
export const REDDIT_BASE = "https://www.reddit.com";
export function getRedditJsonSuffix(subredditNames, params, query, addJSON) {
  const names = subredditNames.replace(/\s/g, "+");
  const js = addJSON ? ".json" : "";
  if (!params && !query) return `/r/${names}${js}`;
  return `/r/${names.replace(/\/^/, "")}/${params}${js}${
    query ? `?${query}` : ""
  }`;
}
export function getRedditJsonURL(name, params, query) {
  const f = getRedditJsonSuffix(name, params, query, true);
  return REDDIT_BASE + f;
}
