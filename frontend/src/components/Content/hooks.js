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
