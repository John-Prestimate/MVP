import { supabase } from "../supabaseClient";

// Get business settings for the current user, including service_types array
export async function getBusinessSettings() {
  // 1. Get the current user's info from Supabase Auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('No user logged in');

  // 2. Ask Supabase for the business_settings row for this user
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;

  // 3. Return the business settings (including service_types array)
  return data;
}

// Update business settings for the current user, including service_types array
export async function updateBusinessSettings(newSettings: any) {
  // 1. Get current user's ID again
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('No user logged in');

  // 2. Send the updated settings (including service_types) to Supabase
  const { error } = await supabase
    .from('business_settings')
    .update(newSettings)
    .eq('user_id', user.id);

  if (error) throw error;
}