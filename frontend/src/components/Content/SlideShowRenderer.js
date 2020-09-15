import { BackButton } from "./BackButton";
import {
  A,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "@hydrophobefireman/ui-lib";
import { prefetchNext } from "./prefetch";
import { useObserver, useObserveNode, useKeyPress } from "./hooks";
import { handler } from "./mediaURLHandler";
/**
 * @param {{data:import("../../reddit_response").RedditApiResponse['data']['children'][0]['data'][]}} param0
 */
function createClamper(min, max) {
  return (value) => Math.min(Math.max(value, min), max);
}

export function SlideShowRenderer({ data, loadNext }) {
  const observerData = useObserver();
  const [activeIndex, setActiveIndex] = useState(0);
  const intersectionCallback = useCallback((index) => setActiveIndex(index));
  const max = Math.max(data ? data.length - 1 : 0, 0);
  const clamp = createClamper(0, max);
  useKeyPress(
    "ArrowUp",
    useCallback(() => setActiveIndex(clamp(activeIndex - 1)), [activeIndex])
  );
  useKeyPress(
    "ArrowDown",
    useCallback(() => setActiveIndex(clamp(activeIndex + 1)), [activeIndex])
  );

  useEffect(() => prefetchNext(data, activeIndex), [activeIndex, data]);
  useEffect(() => activeIndex >= max && loadNext(), [activeIndex, max]);
  const current = data && data[activeIndex];

  return (
    <section class="reddit-reel">
      <nav class="reel-nav">
        <A href="/">
          <BackButton />
        </A>
      </nav>
      <div class="reel-scroll-snap-container">
        {data.map((x, i) => (
          <ReelItem
            data={x}
            observerData={observerData}
            shouldPlay={activeIndex === i}
            index={i}
            intersectionCallback={intersectionCallback}
          />
        ))}
      </div>
      {current && (
        <div class="reel-data-text">
          <a class="reel-link" href={current.permalink}>
            {current.title}
          </a>
        </div>
      )}
    </section>
  );
}

/**
 *
 * @param {{data:import("../../reddit_response").RedditApiResponse['data']['children'][0]['data']}} props
 */
function ReelItem(props) {
  const { data, observerData, shouldPlay, intersectionCallback, index } = props;
  /** @type {{current:HTMLElement}} */
  const ref = useRef();
  const onIntersectionCallback = useCallback(
    (e) => e && intersectionCallback(index),
    [index]
  );
  useObserveNode(ref, onIntersectionCallback, observerData);
  useEffect(() => {
    shouldPlay &&
      ref.current &&
      ref.current.scrollIntoView({ behavior: "smooth" });
  }, [ref, shouldPlay]);
  return (
    <div class="reel-item" ref={ref} data-active-reel-node={shouldPlay}>
      <Player url={data.url} shouldPlay={shouldPlay} alt={data.title} />
    </div>
  );
}

function Player({ url, alt, shouldPlay }) {
  const [source, setSource] = useState([]);
  const [type, setType] = useState(null);
  useEffect(async () => {
    if (!shouldPlay) return;
    const { mediaType, source } = await handler(url);
    setSource(source);
    setType(mediaType);
  }, [url, shouldPlay]);
  if (!shouldPlay || type == null) return <div>Loading..</div>;
  if (type === "img") return <ImgReel source={source} alt={alt} />;
  if (type === "video") return <VideoReel source={source} />;
  return <div>Unknown Media</div>;
}

function ImgReel({ source, alt }) {
  return <img src={source[0].src} alt={alt} class="reel-media" />;
}

const onVideoClick = (e) => e.currentTarget.play && e.currentTarget.play();
function VideoReel({ source }) {
  return (
    <video
      class="reel-media"
      preload="auto"
      // controls
      autoplay
      loop
      onClick={onVideoClick}
    >
      {source.map((x) => (
        <source {...x} />
      ))}
    </video>
  );
}
