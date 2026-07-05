"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";
import { Mode, TARGET_COLUMNS, TARGET_TABLES } from "@/lib/types";

export async function addTarget(formData: FormData) {
  const mode = formData.get("mode") as Mode;
  const value = String(formData.get("value") ?? "").trim();
  if (!value) return;

  const table = TARGET_TABLES[mode];
  const column = TARGET_COLUMNS[mode];

  const supabase = getSupabaseClient();
  await supabase
    .from(table)
    .upsert({ [column]: value, activated: true }, { onConflict: column });

  revalidatePath("/targets");
}

export async function toggleActivated(formData: FormData) {
  const mode = formData.get("mode") as Mode;
  const id = Number(formData.get("id"));
  const nextActivated = formData.get("next_activated") === "true";

  const table = TARGET_TABLES[mode];
  const supabase = getSupabaseClient();
  await supabase.from(table).update({ activated: nextActivated }).eq("id", id);

  revalidatePath("/targets");
}

export async function deleteTarget(formData: FormData) {
  const mode = formData.get("mode") as Mode;
  const id = Number(formData.get("id"));

  const table = TARGET_TABLES[mode];
  const supabase = getSupabaseClient();
  await supabase.from(table).delete().eq("id", id);

  revalidatePath("/targets");
}
