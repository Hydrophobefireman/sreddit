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

const allowedHosts = ["v.redd.it", "gfycat", "redgifs", "i.redd.it"];
export function isValid(data) {
  const url = data.url;
  if (!url) return;
  try {
    const u = new URL(url, "https://reddit.com/");
    return (
      (u.host.includes("imgur") &&
        u.pathname.indexOf("/a/") !== 0 &&
        u.pathname.indexOf("/gallery/") !== 0) ||
      allowedHosts.some((x) => u.host.includes(x))
    );
  } catch {
    return;
  }
}

export function getRequiredData(x) {
  const d = x.data;
  const imgURL = d.url_overridden_by_dest;
  return {
    permalink: REDDIT_BASE + d.permalink,
    title: d.title,
    url: imgURL,
  };
}
