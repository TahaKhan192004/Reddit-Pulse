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

  const baseParams = {
    mode: filters.mode,
    q: filters.q,
    subreddit: filters.subreddit,
    minScore: filters.minScore?.toString(),
    sort: filters.sort,
    limit: filters.limit?.toString(),
  };

  const exportHref = `/api/export?${buildQueryString(baseParams)}`;
  const closeHref = `/results?${buildQueryString(baseParams)}`;
  const openPostHref = (id: number) => `/results?${buildQueryString({ ...baseParams, post: String(id) })}`;

  const selectedPost = rawParams.post
    ? posts.find((post) => String(post.id) === rawParams.post)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                <td className="px-4 py-2.5 max-w-md truncate">
                  <a
                    href={openPostHref(post.id)}
                    title={post.title}
                    className="hover:text-accent hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                  >
                    {post.title}
                  </a>
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

      {selectedPost && (
        <>
          <a
            href={closeHref}
            aria-label="Close post detail"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
              <a
                href={closeHref}
                aria-label="Close"
                className="absolute top-4 right-4 rounded-full p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </a>

              <div className="flex items-center gap-2 text-xs text-muted">
                <span>r/{selectedPost.subreddit}</span>
                <span>·</span>
                <span>
                  {selectedPost.created_utc
                    ? new Date(selectedPost.created_utc * 1000).toLocaleString()
                    : "unknown date"}
                </span>
              </div>

              <h2 className="mt-2 pr-8 text-lg font-semibold tracking-tight text-balance">
                {selectedPost.title}
              </h2>

              <div className="mt-3 flex items-center gap-3 text-sm text-muted tabular-nums">
                <span>{selectedPost.score} score</span>
                <span>{selectedPost.num_comments} comments</span>
                {selectedPost.match_score && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {Math.round(selectedPost.match_score * 100)}% match
                  </span>
                )}
              </div>

              {selectedPost.selftext ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {selectedPost.selftext}
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  This post has no body text (likely a link or image post).
                </p>
              )}

              <a
                href={selectedPost.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground shadow-sm shadow-accent/30 transition-all duration-150 hover:bg-accent-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Open on Reddit
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
