"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";
import { Mode } from "@/lib/types";

export async function updateConfig(formData: FormData) {
  const mode = formData.get("mode") as Mode;
  const enabled = formData.get("enabled") === "on";
  const scheduledTimesRaw = String(formData.get("scheduled_times") ?? "");
  const scheduledTimes = scheduledTimesRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const limitPerTarget = Number(formData.get("limit_per_target") ?? 25);
  const timeFilter = String(formData.get("time_filter") ?? "month");

  const supabase = getSupabaseClient();
  await supabase
    .from("config")
    .update({
      enabled,
      scheduled_times: scheduledTimes,
      times_per_day: scheduledTimes.length,
      limit_per_target: limitPerTarget,
      time_filter: timeFilter,
      updated_at: new Date().toISOString(),
    })
    .eq("mode", mode);

  revalidatePath("/overview");
}
