import { useState, useCallback, loadURL } from "@hydrophobefireman/ui-lib";
import { getRedditJsonSuffix } from "../../util";

export default function Landing() {
  const [value, setValue] = useState("");
  const [sort, setSort] = useState("hot");
  const onInput = useCallback((e) => setValue(e.target.value), []);
  const [range, setRange] = useState("all");

  const onSubmit = useCallback(
    (e) => {
      if (!value) return;
      const url = getRedditJsonSuffix(
        value,
        sort,
        sort === "top" ? `t=${range}` : null
      );
      return loadURL(url);
    },
    [value, sort, range]
  );
  const updateRange = useCallback((e) => {
    setRange(e.target.dataset.range);
  }, []);
  const updateSort = useCallback((e) => {
    setSort(e.target.dataset.sort);
  }, []);

  return (
    <div>
      <div class="landing-header">SReddit - Reddit Slides</div>
      <form action="javascript:" onSubmit={onSubmit}>
        <div>
          <label>
            <span class="sr-only">Search For subreddits</span>
            <input
              class="landing-sub-input"
              value={value}
              onInput={onInput}
              placeholder="name of the subreddits"
            />
          </label>
          <div>
            <div>Select Sort Type</div>
            {["hot", "new", "top"].map((x) => (
              <span
                class={["landing-select", "hoverable"].concat(
                  x === sort ? "selected" : null
                )}
                data-sort={x}
                onClick={updateSort}
              >
                {x}
              </span>
            ))}
          </div>
          {sort === "top" && (
            <div>
              <div>Select range</div>
              {["day", "month", "year", "all"].map((x) => (
                <span
                  class={["landing-select", "hoverable"].concat(
                    x === range ? "selected" : null
                  )}
                  data-range={x}
                  onClick={updateRange}
                >
                  {x}
                </span>
              ))}
            </div>
          )}
        </div>
        {value && <button class="landing-submit hoverable">Search</button>}
      </form>
    </div>
  );
}
