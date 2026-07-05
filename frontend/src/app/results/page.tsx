import { fetchFilteredPosts, parseFilters } from "@/lib/query";
import { MODES } from "@/lib/types";
import { inputClass } from "@/lib/ui";

function buildQueryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return search.toString();
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters = parseFilters(rawParams);
  const posts = await fetchFilteredPosts(filters);

  const exportHref = `/api/export?${buildQueryString({
    mode: filters.mode,
    q: filters.q,
    subreddit: filters.subreddit,
    minScore: filters.minScore?.toString(),
    sort: filters.sort,
    limit: filters.limit?.toString(),
  })}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
          <p className="text-sm text-muted tabular-nums">{posts.length} post(s)</p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground shadow-sm shadow-accent/30 transition-all duration-150 ease-out hover:bg-accent-hover hover:shadow-accent/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Export CSV
        </a>
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-3 items-end rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">Mode</span>
          <select name="mode" defaultValue={filters.mode} className={inputClass}>
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">Title contains</span>
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="search title"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">Subreddit contains</span>
          <input
            type="text"
            name="subreddit"
            defaultValue={filters.subreddit}
            placeholder="e.g. python"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">Min score</span>
          <input
            type="number"
            name="minScore"
            defaultValue={filters.minScore}
            className={`w-24 ${inputClass}`}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">Sort by</span>
          <select name="sort" defaultValue={filters.sort} className={inputClass}>
            <option value="score">Score</option>
            <option value="num_comments">Comments</option>
            <option value="created_utc">Newest</option>
            {filters.mode === "phrase" && <option value="match_score">Match score</option>}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">Limit</span>
          <input
            type="number"
            name="limit"
            defaultValue={filters.limit}
            className={`w-20 ${inputClass}`}
          />
        </label>

        <button
          type="submit"
          className="rounded-lg border border-border bg-background px-4 py-1.5 text-sm font-medium transition-all duration-150 ease-out hover:bg-surface-hover hover:border-accent/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Filter
        </button>
      </form>

      <div className="rounded-2xl border border-border bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-background text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium text-muted">Title</th>
              <th className="px-4 py-2.5 font-medium text-muted">Subreddit</th>
              <th className="px-4 py-2.5 font-medium text-muted">Score</th>
              <th className="px-4 py-2.5 font-medium text-muted">Comments</th>
              {filters.mode === "phrase" && (
                <th className="px-4 py-2.5 font-medium text-muted">Match</th>
              )}
              <th className="px-4 py-2.5 font-medium text-muted">Posted</th>
              <th className="px-4 py-2.5 font-medium text-muted">Link</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.id}
                className="border-t border-border transition-colors hover:bg-surface-hover"
              >
                <td className="px-4 py-2.5 max-w-md truncate" title={post.title}>
                  {post.title}
                </td>
                <td className="px-4 py-2.5 text-muted">r/{post.subreddit}</td>
                <td className="px-4 py-2.5 tabular-nums">{post.score}</td>
                <td className="px-4 py-2.5 tabular-nums">{post.num_comments}</td>
                {filters.mode === "phrase" && (
                  <td className="px-4 py-2.5 tabular-nums">
                    {post.match_score ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        {Math.round(post.match_score * 100)}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
                <td className="px-4 py-2.5 text-muted">
                  {post.created_utc
                    ? new Date(post.created_utc * 1000).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-2.5">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                  >
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted"
                >
                  No posts match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
