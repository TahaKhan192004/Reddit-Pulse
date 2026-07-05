import { fetchFilteredPosts, parseFilters } from "@/lib/query";
import { MODES } from "@/lib/types";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Results</h1>
          <p className="text-sm text-black/60 dark:text-white/60">{posts.length} post(s)</p>
        </div>
        <a
          href={exportHref}
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-1.5 text-sm font-medium"
        >
          Export CSV
        </a>
      </div>

      <form method="get" className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col gap-1 text-sm">
          Mode
          <select
            name="mode"
            defaultValue={filters.mode}
            className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Title contains
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="search title"
            className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Subreddit contains
          <input
            type="text"
            name="subreddit"
            defaultValue={filters.subreddit}
            placeholder="e.g. python"
            className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Min score
          <input
            type="number"
            name="minScore"
            defaultValue={filters.minScore}
            className="w-24 rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Sort by
          <select
            name="sort"
            defaultValue={filters.sort}
            className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
          >
            <option value="score">Score</option>
            <option value="num_comments">Comments</option>
            <option value="created_utc">Newest</option>
            {filters.mode === "phrase" && <option value="match_score">Match score</option>}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Limit
          <input
            type="number"
            name="limit"
            defaultValue={filters.limit}
            className="w-20 rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
          />
        </label>

        <button
          type="submit"
          className="rounded-md border border-black/15 dark:border-white/20 px-4 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10 text-left">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Subreddit</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Comments</th>
              {filters.mode === "phrase" && <th className="px-4 py-2">Match</th>}
              <th className="px-4 py-2">Posted</th>
              <th className="px-4 py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-black/5 dark:border-white/10">
                <td className="px-4 py-2 max-w-md truncate" title={post.title}>
                  {post.title}
                </td>
                <td className="px-4 py-2">r/{post.subreddit}</td>
                <td className="px-4 py-2">{post.score}</td>
                <td className="px-4 py-2">{post.num_comments}</td>
                {filters.mode === "phrase" && (
                  <td className="px-4 py-2">
                    {post.match_score ? `${Math.round(post.match_score * 100)}%` : "-"}
                  </td>
                )}
                <td className="px-4 py-2 text-black/50 dark:text-white/50">
                  {post.created_utc
                    ? new Date(post.created_utc * 1000).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-black/40 dark:text-white/40">
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
