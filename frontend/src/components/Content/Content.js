import { useState } from "@hydrophobefireman/ui-lib";

import { getRedditJsonURL } from "../../util";
import { urlencode, Object_assign as assign } from "@hydrophobefireman/j-utils";
import { RedditSlideShow } from "./RedditSlideShow";
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
