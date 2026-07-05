export type Mode = "keyword" | "phrase" | "subreddit";

export const MODES: Mode[] = ["keyword", "phrase", "subreddit"];

export const TARGET_TABLES: Record<Mode, string> = {
  keyword: "keywords",
  phrase: "phrases",
  subreddit: "subreddits",
};

export const TARGET_COLUMNS: Record<Mode, string> = {
  keyword: "keyword",
  phrase: "phrase",
  subreddit: "subreddit",
};

export const POSTS_TABLES: Record<Mode, string> = {
  keyword: "posts_based_on_keyword",
  phrase: "posts_based_on_phrases",
  subreddit: "posts_based_on_subreddit",
};

export interface ConfigRow {
  mode: Mode;
  enabled: boolean;
  scheduled_times: string[];
  times_per_day: number;
  limit_per_target: number;
  max_posts_per_run: number;
  time_filter: "day" | "week" | "month" | "year" | "all";
  last_run_at: string | null;
  updated_at: string;
}

export interface TargetRow {
  id: number;
  activated: boolean;
  created_at: string;
  keyword?: string;
  phrase?: string;
  subreddit?: string;
}

export interface PostRow {
  id: number;
  keyword?: string;
  phrase?: string;
  subreddit: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number | null;
  match_score?: number;
  scraped_at: string;
}
