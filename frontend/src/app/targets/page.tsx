import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { Mode, MODES, TARGET_COLUMNS, TARGET_TABLES, TargetRow } from "@/lib/types";
import { inputClass } from "@/lib/ui";
import { SubmitButton } from "@/components/SubmitButton";
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
        <h1 className="text-2xl font-semibold tracking-tight">Targets</h1>
        <p className="text-sm text-muted">
          Manage keywords, phrases, and subreddits used by the scraper.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <Link
            key={m}
            href={`/targets?mode=${m}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              m === mode
                ? "bg-accent text-accent-foreground border-transparent"
                : "border-border text-muted hover:bg-surface-hover hover:text-foreground"
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
          className={`flex-1 ${inputClass}`}
        />
        <SubmitButton pendingLabel="Adding…">Add</SubmitButton>
      </form>

      <div className="rounded-2xl border border-border bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-background text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium text-muted capitalize">{column}</th>
              <th className="px-4 py-2.5 font-medium text-muted">Status</th>
              <th className="px-4 py-2.5 font-medium text-muted">Added</th>
              <th className="px-4 py-2.5 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-border transition-colors hover:bg-surface-hover"
              >
                <td className="px-4 py-2.5">{row[column as keyof TargetRow] as string}</td>
                <td className="px-4 py-2.5">
                  <form action={toggleActivated}>
                    <input type="hidden" name="mode" value={mode} />
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      type="hidden"
                      name="next_activated"
                      value={(!row.activated).toString()}
                    />
                    <SubmitButton
                      pendingLabel="…"
                      variant="ghost"
                      className={`!px-2.5 !py-1 !rounded-full !text-xs ${
                        row.activated
                          ? "bg-success-bg text-success hover:bg-success-bg"
                          : "bg-background text-muted"
                      }`}
                    >
                      {row.activated ? "Active" : "Inactive"}
                    </SubmitButton>
                  </form>
                </td>
                <td className="px-4 py-2.5 text-muted">
                  {new Date(row.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteTarget}>
                    <input type="hidden" name="mode" value={mode} />
                    <input type="hidden" name="id" value={row.id} />
                    <SubmitButton pendingLabel="…" variant="danger" className="!px-2.5 !py-1">
                      Delete
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No {mode}s yet — add one above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
