import { NextRequest } from "next/server";
import { fetchFilteredPosts, parseFilters, toCsv } from "@/lib/query";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filters = parseFilters({
    mode: searchParams.get("mode") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    subreddit: searchParams.get("subreddit") ?? undefined,
    minScore: searchParams.get("minScore") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  const posts = await fetchFilteredPosts(filters);
  const csv = toCsv(posts, filters.mode);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filters.mode}-posts.csv"`,
    },
  });
}
