import { getSupabaseClient } from "@/lib/supabase";
import { ConfigRow, MODES, POSTS_TABLES, TARGET_TABLES } from "@/lib/types";
import { inputClass } from "@/lib/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { triggerRun, updateConfig } from "./actions";

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

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ ran?: string; error?: string }>;
}) {
  const { configRows, postCounts, activeTargetCounts } = await getData();
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted">Per-mode schedule, limits, and run status.</p>
        </div>

        <form action={triggerRun}>
          <input type="hidden" name="mode" value="all" />
          <SubmitButton pendingLabel="Dispatching…">Run all now</SubmitButton>
        </form>
      </div>

      {params.ran && (
        <div className="flex items-center gap-2 rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
          Triggered a &quot;{params.ran}&quot; run on GitHub Actions. Check the Actions tab for
          progress.
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
          Failed to trigger run: {params.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODES.map((mode) => {
          const config = configRows.find((row) => row.mode === mode);
          if (!config) return null;

          return (
            <form
              key={mode}
              action={updateConfig}
              className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-accent/70" />
              <input type="hidden" name="mode" value={mode} />

              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold capitalize tracking-tight">{mode}</h2>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={config.enabled}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  Enabled
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted">Posts</div>
                  <div className="text-lg font-semibold tabular-nums">{postCounts[mode]}</div>
                </div>
                <div className="rounded-lg bg-background px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted">
                    Active targets
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    {activeTargetCounts[mode]}
                  </div>
                </div>
              </div>

              <label className="text-sm flex flex-col gap-1">
                <span className="text-xs text-muted">Scheduled times (UTC, comma-separated)</span>
                <input
                  type="text"
                  name="scheduled_times"
                  defaultValue={(config.scheduled_times ?? []).join(", ")}
                  placeholder="06:00, 14:00, 20:00"
                  className={inputClass}
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm flex flex-col gap-1">
                  <span className="text-xs text-muted">Limit per target</span>
                  <input
                    type="number"
                    name="limit_per_target"
                    min={1}
                    max={100}
                    defaultValue={config.limit_per_target}
                    className={inputClass}
                  />
                </label>

                <label className="text-sm flex flex-col gap-1">
                  <span className="text-xs text-muted">Max posts/run</span>
                  <input
                    type="number"
                    name="max_posts_per_run"
                    min={1}
                    max={500}
                    defaultValue={config.max_posts_per_run}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="text-sm flex flex-col gap-1">
                <span className="text-xs text-muted">Time filter</span>
                <select
                  name="time_filter"
                  defaultValue={config.time_filter}
                  className={inputClass}
                >
                  {TIME_FILTERS.map((filter) => (
                    <option key={filter} value={filter}>
                      {filter}
                    </option>
                  ))}
                </select>
              </label>

              <div className="text-xs text-muted">Last run: {formatDate(config.last_run_at)}</div>

              <div className="flex gap-2 pt-1">
                <SubmitButton action={updateConfig} pendingLabel="Saving…" className="flex-1">
                  Save
                </SubmitButton>
                <SubmitButton
                  action={triggerRun}
                  pendingLabel="Dispatching…"
                  variant="secondary"
                  className="flex-1"
                >
                  Run now
                </SubmitButton>
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
