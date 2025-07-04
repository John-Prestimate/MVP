import { supabase } from "../supabaseClient";

/**
 * Ensures a business_settings row exists for the given userId.
 * Logs all key steps and errors for debugging.
 * Returns true if a new row was created, false if one already existed.
 */
export async function ensureBusinessSettings(userId: string) {
  console.log("[ensureBusinessSettings] Checking for business_settings row for user:", userId);

  // Check for existing row
  const { data, error } = await supabase
    .from("business_settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[ensureBusinessSettings] SELECT error:", error);
  } else {
    console.log("[ensureBusinessSettings] SELECT result:", data);
  }

  if (!data) {
    // Row does not exist, try to insert
    console.log("[ensureBusinessSettings] No row found, inserting for user:", userId);
    const { data: insertData, error: insertError } = await supabase
      .from("business_settings")
      .insert([{ user_id: userId }])
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error("[ensureBusinessSettings] INSERT error:", insertError);
      throw insertError;
    }
    if (insertData) {
      console.log("[ensureBusinessSettings] Successfully inserted row:", insertData);
      return true;
    }
    console.warn("[ensureBusinessSettings] Inserted, but no data returned");
    return true;
  }

  console.log("[ensureBusinessSettings] Row already exists for user:", userId, data);
  return false;
}