import { requests } from "../../util";
import { FakeSet, urlencode } from "@hydrophobefireman/j-utils";
export const prefetched = new FakeSet();

const FORMAT = "%%F%%";
const REGEX_VID = /gif|gifv|mp4|webm/;
/**
 * @param {string} urlString
 */
export async function handler(urlString, preload) {
  if (preload && prefetched.has(urlString)) {
    return null;
  }
  prefetched.add(url);
  const url = new URL(urlString);
  url.protocol = "https:";

  if (url.host.includes("imgur")) {
    return imgurHandler(url);
  }
  if (url.host.includes("i.redd.it")) {
    return iRedditHandler(url);
  }
  if (url.host.includes("gfycat") || url.host.includes("redgifs")) {
    return await gfyCatsHandler(url, preload);
  }
  return await vRedditHandler(url);
}
/**
 *
 * @param {URL} url
 */
function imgurHandler(url) {
  if (REGEX_VID.test(url.pathname.split(".")[1])) {
    url.pathname = url.pathname.replace(/\.\w+$/, FORMAT);
    const str = url.toString();

    return {
      mediaType: "video",
      source: [
        { src: str.replace(FORMAT, ".webm"), type: "video/webm" },
        { src: str.replace(FORMAT, ".mp4"), type: "video/mp4" },
      ],
    };
  } else {
    if (
      ["jpg", "jpeg", "png", "webp"].every(
        (x) => !url.pathname.includes(`.${x}`)
      )
    ) {
      url.pathname += ".jpg";
    }
    return { mediaType: "img", source: [{ src: url.toString() }] };
  }
}

function iRedditHandler(url) {
  return { mediaType: "img", source: [{ src: url.toString() }] };
}

async function gfyCatsHandler(url, preload) {
  if (preload) return null;
  const req = `https://api.${url.host.replace("www.", "")}/v1/gfycats/${
    /(gifs\/detail\/)?(\/watch\/)?(\w+)/.exec(url.pathname)[3]
  }`;
  const resp = await (await requests.get(req)).json();
  return {
    mediaType: "video",
    source: [
      { src: resp.gfyItem.webmUrl, type: "video/webm" },
      { src: resp.gfyItem.mp4Url, type: "video/mp4" },
    ],
  };
}

async function vRedditHandler(url) {
  let { source } = await (
    await requests.get(`/media/link/?${urlencode({ url: url.toString() })}`)
  ).json();

  return { mediaType: "video", source };
}
