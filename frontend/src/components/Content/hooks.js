import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "@hydrophobefireman/ui-lib";
import { requests, isValid, getRequiredData } from "../../util";
import { FakeWeakSet, FakeWeakMap } from "@hydrophobefireman/j-utils";

/**
 * @param {string} url
 * @returns {import('../../reddit_response').RedditApiResponse['data']['children']}
 */
export function useRedditData(url) {
  const [data, setData] = useState([]);
  const [nextId, setId] = useState(null);
  useEffect(async () => {
    try {
      /** @type {import('../../reddit_response').RedditApiResponse} */
      const response = await (await requests.get(url)).json();
      const children = response.data.children;
      const ret = children.map(getRequiredData).filter(isValid);
      setData((x) => x.concat(ret));
      setId(response.data.after);
    } catch (e) {
      console.warn(e);
      setData([]);
    }
  }, [url]);
  return [data, nextId];
}

export function useKeyPress(key, onKeyPress) {
  useEffect(() => {
    if (!key) return;
    const keyDownListener = (e) => e.key === key && onKeyPress(e);
    window.addEventListener("keydown", keyDownListener);
    return () => {
      window.removeEventListener("keydown", keyDownListener);
    };
  }, [key, onKeyPress]);
}

export function useObserver(threshold = 0.5) {
  const intersectionMap = useMemo(() => new FakeWeakMap(), []);

  const observer = useRef();
  const callback = useCallback((entries) =>
    entries.some((entry) => {
      const func = intersectionMap.get(entry.target);
      func && func(entry.isIntersecting);
    })
  );
  useEffect(() => {
    const curr = (observer.current = new IntersectionObserver(callback, {
      threshold,
    }));

    return () => curr.disconnect();
  }, [threshold]);
  return [intersectionMap, observer];
}

export function useObserveNode(ref, callback, [intersectionMap, observer]) {
  useEffect(() => {
    const element = ref.current;
    intersectionMap.set(element, callback);
    observer.current && observer.current.observe(element);
    return () => {
      intersectionMap.delete(element);
      observer.current && observer.current.unobserve(element);
    };
  }, [ref, callback]);
}

export const directions = {
  LEFT: 0,
  RIGHT: 1,
  UP: 2,
  DOWN: 3,
};
export function useSwipeEvent(container, threshold, swipeCB) {
  threshold = threshold || 0;
  // Swipe Up / Down / Left / Right

  const initialY = useRef();

  const onTouchStart = useCallback(
    ({ touches }) => {
      const touch = touches[0];
      initialY.current = touch.clientY;
      swipeCB(null);
    },
    [swipeCB]
  );

  const onTouchMove = useCallback(
    ({ touches }) => {
      if (initialY.current == null) {
        return swipeCB(null);
      }
      let shouldReset = false;
      const touch = touches[0];

      const currentY = touch.clientY;

      const diffY = initialY.current - currentY;

      // sliding vertically
      if (diffY > threshold) {
        shouldReset = true;
        swipeCB(directions.UP);
      } else if (diffY < -threshold) {
        shouldReset = true;
        swipeCB(directions.DOWN);
      }

      if (shouldReset) {
        initialY.current = null;
      } else {
        swipeCB(null);
      }
    },
    [threshold, swipeCB]
  );
  useEffect(() => {
    const current = container.current;

    current.addEventListener("touchstart", onTouchStart, false);
    current.addEventListener("touchmove", onTouchMove, false);
    return () => {
      current.removeEventListener("touchstart", onTouchStart);
      current.removeEventListener("touchmove", onTouchMove);
    };
  }, [container, container.current, onTouchStart, onTouchMove]);
}

const getDimensions = () => [window.innerHeight, window.innerWidth];
export function useViewportSize() {
  const [dimensions, setDimensions] = useState(getDimensions);

  useEffect(() => {
    const callback = () => setDimensions(getDimensions);
    addEventListener("resize", callback);
    return () => removeEventListener("resize", callback);
  }, []);

  return dimensions;
}
