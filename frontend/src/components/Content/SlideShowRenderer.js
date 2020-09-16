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
            activeIndex={activeIndex}
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
  const {
    data,
    observerData,
    activeIndex,
    intersectionCallback,
    index,
  } = props;
  const isActiveReelNode = activeIndex === index;
  /** @type {{current:HTMLElement}} */
  const ref = useRef();
  const onIntersectionCallback = useCallback(
    (e) => {
      e && intersectionCallback(index);
    },
    [index, ref]
  );
  useObserveNode(ref, onIntersectionCallback, observerData);
  useEffect(() => {
    isActiveReelNode &&
      ref.current &&
      ref.current.scrollIntoView({ behavior: "smooth" });
  }, [ref, isActiveReelNode]);
  const isHidden = Math.abs(activeIndex - index) > 1;
  const canLazyLoad = !isHidden && !isActiveReelNode;
  return (
    <div class="reel-item" ref={ref} data-active-reel-node={isActiveReelNode}>
      <Player
        url={data.url}
        alt={data.title}
        isHidden={isHidden}
        canLazyLoad={canLazyLoad}
      />
    </div>
  );
}

function Player({ url, alt, isHidden, canLazyLoad }) {
  const [source, setSource] = useState([]);
  const [type, setType] = useState(null);
  // const [fetching, setFetching] = useState(false);
  useEffect(async () => {
    if (isHidden || (source && source.length)) return;
    // setFetching(true);
    const { mediaType, source: $source } = await handler(url);
    setSource($source);
    setType(mediaType);
  }, [url, isHidden, source]);

  if (isHidden || type == null) return <loading-spinner />;
  if (type === "img") return <ImgReel source={source} alt={alt} />;
  if (canLazyLoad) return <loading-spinner />;
  if (type === "video") return <VideoReel source={source} />;
  return <div>Unknown Media</div>;
}

function ImgReel({ source, alt }) {
  return (
    <img src={source[0].src} alt={alt} loading="lazy" class="reel-media" />
  );
}

const onVideoClick = (e) => e.currentTarget.play && e.currentTarget.play();
function VideoReel({ source }) {
  return (
    <video
      class="reel-media"
      preload="auto"
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
