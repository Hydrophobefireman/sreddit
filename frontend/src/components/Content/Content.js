import {
  useState,
  useEffect,
  useCallback,
  AsyncComponent,
} from "@hydrophobefireman/ui-lib";

import {
  getRedditJsonURL,
  requests,
  isValid,
  getRequiredData,
} from "../../util";
import { urlencode, Object_assign as assign } from "@hydrophobefireman/j-utils";

export default function Content(props) {
  const params = props.params || {};
  const sub = params.sub;
  const sorting = params.sort || "hot";
  const range = new URLSearchParams(location.search).get("t");
  const [after, setAfter] = useState(null);

  const query = assign({}, range && { t: range }, after && { after });

  const redditURL = getRedditJsonURL(sub, sorting, urlencode(query));

  return <RedditSlideShow url={redditURL} next={setAfter} />;
}

function RedditSlideShow({ url, next }) {
  const [data, setData] = useState([]);
  const [nextId, setId] = useState(null);
  const setNextId = useCallback(() => next(nextId), [nextId]);

  useEffect(async () => {
    /** @type {import('../../reddit_response').RedditApiResponse} */
    try {
      const response = await (await requests.get(url)).json();
      const children = response.data.children;
      setId(response.data.after);
      const ret = data.concat(children.map(getRequiredData).filter(isValid));
      setData(ret);
    } catch (e) {
      console.warn(e);
      setData([]);
    }
  }, [url]);
  return <SlideShowRenderer data={data} next={setNextId} />;
}

/**
 *
 * @param {{data:import("../../reddit_response").RedditApiResponse['data']['children'][0]['data'][]}} param0
 */
function SlideShowRenderer({ data, next }) {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);
  const toggle = useCallback(() => setShow((s) => !s), []);
  const increment = useCallback(() => setIndex((i) => i + 1), []);
  const decrement = useCallback(() => setIndex((i) => i - 1), []);

  useKeyPress("ArrowRight", increment);
  useKeyPress("ArrowLeft", decrement);

  const onButtonClick = useCallback((e) => {
    const idx = +e.target.dataset.idx;
    setIndex(idx);
  }, []);
  useEffect(() => {
    if (index === data.length - 1) next();
  }, [index, data]);
  const onClick = useCallback(
    (e) => {
      const clickTarget = e.target;
      const clickTargetWidth = clickTarget.offsetWidth;
      const xCoordInClickTarget =
        e.clientX - clickTarget.getBoundingClientRect().left;
      let newIndex;
      if (clickTargetWidth / 4 > xCoordInClickTarget) {
        newIndex = index - 1;
        if (newIndex < 0) newIndex = 0;
      } else {
        newIndex = index + 1;
      }
      setIndex(newIndex);
    },
    [index]
  );
  const promise = useCallback(() => getMediaData(data[index], onClick), [
    data,
    index,
  ]);
  return (
    <section class="slideshow">
      <div>
        <AsyncComponent promise={promise} fallback={() => "Loading.."} />
      </div>
      {data && data.length > 0 && (
        <div class="slideshow-set-index-container">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <span>
              <a
                href={data[index].permalink}
                style={{ color: "white", marginRight: "10px" }}
              >
                {data[index].title}
              </a>
            </span>
            <div
              style={{
                fontSize: "1.2rem",
                textAlign: "right",
                position: "sticky",
                top: 0,
                marginLeft: "auto",
              }}
            >
              <span class="hoverable" onClick={toggle}>
                --
              </span>
            </div>
          </div>
          {show && (
            <div>
              {data.map((_, i) => (
                <button
                  onClick={onButtonClick}
                  data-idx={i}
                  style={i === index ? { background: "blue" } : null}
                  class={["slideshow-set-index hoverable"]}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
const REGEX_VID = /gif|gifv|mp4|webm/;
/**
 *
 * @param {import("../../reddit_response").RedditApiResponse['data']['children'][0]['data']} data
 */
async function getMediaData(data, onClick) {
  if (!data) return null;
  const FORMAT = "%FORMAT%";
  const url = new URL(data.url);
  url.protocol = "https:";
  let mediaType = "img";
  let availableURLs = null;
  if (url.host.includes("imgur")) {
    if (REGEX_VID.test(url.pathname.split(".")[1])) {
      url.pathname = url.pathname.replace(/\.\w+$/, FORMAT);
      const str = url.toString();
      mediaType = "video";
      availableURLs = [
        { src: str.replace(FORMAT, ".webm"), type: "video/webm" },
        { src: str.replace(FORMAT, ".mp4"), type: "video/mp4" },
      ];
    } else {
      if (
        ["jpg", "jpeg", "png", "webp"].every(
          (x) => !url.pathname.includes(`.${x}`)
        )
      ) {
        url.pathname += ".jpg";
      }
      availableURLs = [{ src: url.toString() }];
    }
  } else if (url.host.includes("i.redd.it")) {
    mediaType = "img";
    availableURLs = [{ src: url.toString() }];
  } else if (url.host.includes("gfycat") || url.host.includes("redgifs")) {
    const req = `https://api.${url.host.replace("www.", "")}/v1/gfycats/${
      /(gifs\/detail\/)?(\/watch\/)?(\w+)/.exec(url.pathname)[3]
    }`;
    const resp = await (await requests.get(req)).json();
    mediaType = "video";
    availableURLs = [
      { src: resp.gfyItem.webmUrl, type: "video/webm" },
      { src: resp.gfyItem.mp4Url, type: "video/mp4" },
    ];
  } else {
    let { availableURLs: _av } = await (
      await requests.get(`/media/link/?${urlencode({ url: url.toString() })}`)
    ).json();
    availableURLs = _av;
    mediaType = "video";
  }
  return (
    <Player
      availableURLs={availableURLs}
      mediaType={mediaType}
      onClick={onClick}
    />
  );
}

function Player({ availableURLs, mediaType, onClick }) {
  try {
    const onElementClick = useCallback(
      (e) => {
        e.target.play && e.target.play();
        onClick(e);
      },
      [onClick]
    );
    // create a new function to force a remount, otherwise <img> tags show previous image
    const Resp = () => (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {mediaType === "video" ? (
          <video
            class="slideshow-media"
            preload="auto"
            autoplay
            loop
            onClick={onElementClick}
          >
            {availableURLs.map((x) => (
              <source {...x} />
            ))}
          </video>
        ) : (
          <img
            class="slideshow-media"
            src={availableURLs[0].src}
            onClick={onElementClick}
          />
        )}
      </div>
    );
    return <Resp />;
  } catch (e) {
    console.log(availableURLs);
    return <div>Error</div>;
  }
}

function useKeyPress(key, onKeyPress) {
  useEffect(() => {
    if (!key) return;
    const keyDownListener = (e) => e.key === key && onKeyPress(e);
    window.addEventListener("keydown", keyDownListener);
    return () => {
      window.removeEventListener("keydown", keyDownListener);
    };
  }, [key, onKeyPress]);
}
