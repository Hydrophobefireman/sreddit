import { BackButton } from "./BackButton";
import {
  A,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "@hydrophobefireman/ui-lib";
import { prefetchNext } from "./prefetch";
import {
  useKeyPress,
  useViewportSize,
  useSwipeEvent,
  directions,
} from "./hooks";
import { handler } from "./mediaURLHandler";
/**
 * @param {{data:import("../../reddit_response").RedditApiResponse['data']['children'][0]['data'][]}} param0
 */
function createClamper(min, max) {
  return (value) => Math.min(Math.max(value, min), max);
}

export function SlideShowRenderer({ data, loadNext }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [height] = useViewportSize();
  const max = Math.max(data ? data.length - 1 : 0, 0);
  const didIncrement = useRef(true);
  const clamp = createClamper(0, max);

  const $ref = useRef();

  const increment = useCallback(() => {
    didIncrement.current = true;
    setActiveIndex((i) => clamp(i + 1));
  }, [clamp]);
  const decrement = useCallback(() => {
    didIncrement.current = false;
    setActiveIndex((i) => clamp(i - 1));
  }, [clamp]);
  const swipCB = useCallback(
    (swipe) => {
      if (swipe === directions.UP) increment();
      else if (swipe === directions.DOWN) decrement();
    },
    [increment, decrement]
  );
  useSwipeEvent($ref, height / 6, swipCB);

  useKeyPress("ArrowUp", decrement);
  useKeyPress("ArrowDown", increment);

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
      <div
        class="reel-scroll-snap-container"
        ref={$ref}
        style={{ overflow: "hidden" }}
      >
        {data.slice(0, clamp(activeIndex + 2)).map((x, i) => (
          <ReelItem
            data={x}
            activeIndex={activeIndex}
            index={i}
            didIncrement={didIncrement}
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
  const { data, activeIndex, index, didIncrement } = props;
  const isActiveReelNode = activeIndex === index;
  /** @type {{current:HTMLElement}} */
  const ref = useRef();

  useEffect(() => {
    isActiveReelNode && ref.current && ref.current.scrollIntoView();
  }, [ref, isActiveReelNode]);
  const isHidden = Math.abs(activeIndex - index) > 1;
  const canLazyLoad = !isHidden && !isActiveReelNode;
  return (
    <div
      class={[
        "reel-item",
        isActiveReelNode
          ? didIncrement.current
            ? "move-up"
            : "move-down"
          : null,
      ]}
      ref={ref}
      data-active-reel-node={isActiveReelNode}
    >
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
