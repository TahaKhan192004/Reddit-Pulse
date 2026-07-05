import { getSupabaseClient } from "@/lib/supabase";
import { Mode, PostRow, POSTS_TABLES } from "@/lib/types";

export interface ResultFilters {
  mode: Mode;
  q?: string;
  subreddit?: string;
  minScore?: number;
  sort?: "score" | "created_utc" | "match_score" | "num_comments";
  limit?: number;
}

export function parseFilters(params: Record<string, string | undefined>): ResultFilters {
  const mode = (params.mode as Mode) || "keyword";
  const minScore = params.minScore ? Number(params.minScore) : undefined;
  const limit = params.limit ? Number(params.limit) : 200;
  const sort = (params.sort as ResultFilters["sort"]) || "score";

  return {
    mode,
    q: params.q?.trim() || undefined,
    subreddit: params.subreddit?.trim() || undefined,
    minScore: Number.isFinite(minScore) ? minScore : undefined,
    sort,
    limit: Number.isFinite(limit) ? limit : 200,
  };
}

export async function fetchFilteredPosts(filters: ResultFilters): Promise<PostRow[]> {
  const supabase = getSupabaseClient();
  const table = POSTS_TABLES[filters.mode];

  let query = supabase.from(table).select("*");

  if (filters.q) {
    query = query.ilike("title", `%${filters.q}%`);
  }
  if (filters.subreddit) {
    query = query.ilike("subreddit", `%${filters.subreddit}%`);
  }
  if (typeof filters.minScore === "number") {
    query = query.gte("score", filters.minScore);
  }

  const validSortColumns =
    filters.mode === "phrase"
      ? ["score", "num_comments", "created_utc", "match_score"]
      : ["score", "num_comments", "created_utc"];
  const sortColumn = filters.sort && validSortColumns.includes(filters.sort) ? filters.sort : "score";
  query = query.order(sortColumn, { ascending: false }).limit(filters.limit ?? 200);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as PostRow[];
}

export function toCsv(rows: PostRow[], mode: Mode): string {
  const baseColumns = [
    "title",
    "subreddit",
    "score",
    "num_comments",
    "permalink",
    "url",
    "created_utc",
    "scraped_at",
  ];
  const sourceColumn = mode === "keyword" ? "keyword" : mode === "phrase" ? "phrase" : null;
  const columns = [
    ...(sourceColumn ? [sourceColumn] : []),
    ...baseColumns,
    ...(mode === "phrase" ? ["match_score"] : []),
  ];

  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns.map((col) => escape((row as unknown as Record<string, unknown>)[col])).join(",")
  );

  return [header, ...lines].join("\n");
}
