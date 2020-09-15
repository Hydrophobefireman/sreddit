import { useCallback } from "@hydrophobefireman/ui-lib";
import { useRedditData } from "./hooks";
import { SlideShowRenderer } from "./SlideShowRenderer";

export function RedditSlideShow({ url, next }) {
  const [data, nextId] = useRedditData(url);
  const loadNext = useCallback(() => next(nextId), [nextId]);
  return <SlideShowRenderer data={data} loadNext={loadNext} />;
}
