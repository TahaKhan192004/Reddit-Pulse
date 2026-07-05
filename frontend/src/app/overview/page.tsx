import { getSupabaseClient } from "@/lib/supabase";
import { ConfigRow, MODES, POSTS_TABLES, TARGET_TABLES } from "@/lib/types";
import { updateConfig } from "./actions";

const TIME_FILTERS = ["day", "week", "month", "year", "all"] as const;

async function getData() {
  const supabase = getSupabaseClient();

  const [{ data: configRows }, ...rest] = await Promise.all([
    supabase.from("config").select("*").order("mode"),
    ...MODES.map((mode) =>
      supabase.from(POSTS_TABLES[mode]).select("*", { count: "exact", head: true })
    ),
    ...MODES.map((mode) =>
      supabase
        .from(TARGET_TABLES[mode])
        .select("*", { count: "exact", head: true })
        .eq("activated", true)
    ),
  ]);

  const postCounts: Record<string, number> = {};
  const activeTargetCounts: Record<string, number> = {};
  MODES.forEach((mode, index) => {
    postCounts[mode] = rest[index]?.count ?? 0;
    activeTargetCounts[mode] = rest[MODES.length + index]?.count ?? 0;
  });

  return { configRows: (configRows ?? []) as ConfigRow[], postCounts, activeTargetCounts };
}

function formatDate(value: string | null) {
  if (!value) return "never";
  return new Date(value).toLocaleString();
}

export default async function OverviewPage() {
  const { configRows, postCounts, activeTargetCounts } = await getData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Per-mode schedule, limits, and run status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODES.map((mode) => {
          const config = configRows.find((row) => row.mode === mode);
          if (!config) return null;

          return (
            <form
              key={mode}
              action={updateConfig}
              className="rounded-xl border border-black/10 dark:border-white/10 p-4 flex flex-col gap-3"
            >
              <input type="hidden" name="mode" value={mode} />

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold capitalize">{mode}</h2>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={config.enabled}
                    className="h-4 w-4"
                  />
                  Enabled
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-black/60 dark:text-white/60">
                <div>
                  <div className="text-xs uppercase tracking-wide">Posts</div>
                  <div className="text-black dark:text-white text-base font-medium">
                    {postCounts[mode]}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide">Active targets</div>
                  <div className="text-black dark:text-white text-base font-medium">
                    {activeTargetCounts[mode]}
                  </div>
                </div>
              </div>

              <label className="text-sm flex flex-col gap-1">
                Scheduled times (UTC, comma-separated)
                <input
                  type="text"
                  name="scheduled_times"
                  defaultValue={(config.scheduled_times ?? []).join(", ")}
                  placeholder="06:00, 14:00, 20:00"
                  className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
                />
              </label>

              <label className="text-sm flex flex-col gap-1">
                Limit per target
                <input
                  type="number"
                  name="limit_per_target"
                  min={1}
                  max={100}
                  defaultValue={config.limit_per_target}
                  className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
                />
              </label>

              <label className="text-sm flex flex-col gap-1">
                Time filter
                <select
                  name="time_filter"
                  defaultValue={config.time_filter}
                  className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1"
                >
                  {TIME_FILTERS.map((filter) => (
                    <option key={filter} value={filter}>
                      {filter}
                    </option>
                  ))}
                </select>
              </label>

              <div className="text-xs text-black/50 dark:text-white/50">
                Last run: {formatDate(config.last_run_at)}
              </div>

              <button
                type="submit"
                className="mt-1 rounded-md bg-black text-white dark:bg-white dark:text-black py-1.5 text-sm font-medium"
              >
                Save
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
