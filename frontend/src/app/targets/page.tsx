import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { Mode, MODES, TARGET_COLUMNS, TARGET_TABLES, TargetRow } from "@/lib/types";
import { addTarget, deleteTarget, toggleActivated } from "./actions";

function isMode(value: string | undefined): value is Mode {
  return !!value && MODES.includes(value as Mode);
}

export default async function TargetsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode: Mode = isMode(params.mode) ? (params.mode as Mode) : "keyword";

  const table = TARGET_TABLES[mode];
  const column = TARGET_COLUMNS[mode];

  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as TargetRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Targets</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Manage keywords, phrases, and subreddits used by the scraper.
        </p>
      </div>

      <div className="flex gap-2">
        {MODES.map((m) => (
          <Link
            key={m}
            href={`/targets?mode=${m}`}
            className={`rounded-full px-4 py-1.5 text-sm capitalize border ${
              m === mode
                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {m}s
          </Link>
        ))}
      </div>

      <form action={addTarget} className="flex gap-2 max-w-md">
        <input type="hidden" name="mode" value={mode} />
        <input
          type="text"
          name="value"
          placeholder={`New ${column}`}
          required
          className="flex-1 rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-1.5 text-sm font-medium"
        >
          Add
        </button>
      </form>

      <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10 text-left">
            <tr>
              <th className="px-4 py-2 capitalize">{column}</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Added</th>
              <th className="px-4 py-2 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-black/5 dark:border-white/10">
                <td className="px-4 py-2">{row[column as keyof TargetRow] as string}</td>
                <td className="px-4 py-2">
                  <form action={toggleActivated}>
                    <input type="hidden" name="mode" value={mode} />
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      type="hidden"
                      name="next_activated"
                      value={(!row.activated).toString()}
                    />
                    <button
                      type="submit"
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        row.activated
                          ? "bg-green-500/15 text-green-600 dark:text-green-400"
                          : "bg-black/10 dark:bg-white/10 text-black/50 dark:text-white/50"
                      }`}
                    >
                      {row.activated ? "Active" : "Inactive"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2 text-black/50 dark:text-white/50">
                  {new Date(row.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={deleteTarget}>
                    <input type="hidden" name="mode" value={mode} />
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-black/40 dark:text-white/40">
                  No {mode}s yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
