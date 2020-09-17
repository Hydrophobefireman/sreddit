import { handler, prefetched } from "./mediaURLHandler";
export function prefetchNext(data, currentIndex) {
  for (let i = currentIndex; i < currentIndex + 5; i++) {
    _prefetch(data[i]);
  }
}

async function _prefetch(data) {
  if (data) {
    const url = data.url;
    const ret = await handler(url, true);
    if (ret) {
      const { mediaType, source } = ret;
      if (mediaType === "img") {
        const src = source[0];
        const url = src && src.src;
        if (!url) return;
        new Image().src = url;
      }
    }
  }
}
