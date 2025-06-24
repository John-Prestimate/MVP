// Supabase service API for dashboard and mapview integration
import { supabase } from "../supabaseClient";

// Default services for new or empty business_settings
const DEFAULT_SERVICES = [
  { key: "house", label: "House", base_price: 0.30, unit: "ft²" },
  { key: "driveway", label: "Driveway", base_price: 0.20, unit: "ft²" },
  { key: "fence", label: "Fence", base_price: 0.30, unit: "ft" },
  { key: "roof-wash", label: "Roof Wash", base_price: 0.30, unit: "ft²" },
  { key: "deck-wash", label: "Deck Wash", base_price: 0.30, unit: "ft²" },
];
/**
 * Fetches the service_types array for the given user from business_settings.
 * If no row exists or if the array is empty, the row is initialized with default services.
 */
export async function fetchServices(userId: string) {
  const { data, error } = await supabase
    .from("business_settings")
    .select("service_types, id")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No row: create one with defaults
      await supabase
        .from("business_settings")
        .insert([{ user_id: userId, service_types: DEFAULT_SERVICES }]);
      return DEFAULT_SERVICES;
    }
    throw error;
  }

  // If the row exists but is missing or has empty service_types, update to defaults
  if (!data.service_types || data.service_types.length === 0) {
    await supabase
      .from("business_settings")
      .update({ service_types: DEFAULT_SERVICES })
      .eq("id", data.id);
    return DEFAULT_SERVICES;
  }

  return data.service_types;
}

/**
 * Adds a new service to the user's service_types array.
 */
export async function addService(
  userId: string,
  key: string,
  label: string,
  unit: string,
  base_price: number
) {
  let { data, error } = await supabase
    .from("business_settings")
    .select("service_types, id")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: No rows found

  const newService = { key, label, unit, base_price };

  if (!data) {
    // No row exists, create it with this service
    const { error: insertError } = await supabase
      .from("business_settings")
      .insert([
        {
          user_id: userId,
          service_types: [newService],
        },
      ]);
    if (insertError) throw insertError;
    return newService;
  } else {
    // Row exists, update it
    const updatedServices = [...(data?.service_types || []), newService];
    const { error: updateError } = await supabase
      .from("business_settings")
      .update({ service_types: updatedServices })
      .eq("id", data.id);
    if (updateError) throw updateError;
    return newService;
  }
}

/**
 * Updates a service in the user's service_types array.
 */
export async function updateService(
  userId: string,
  key: string,
  label: string,
  unit: string,
  base_price: number
) {
  const { data, error } = await supabase
    .from("business_settings")
    .select("service_types, id")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  const updatedServices = (data?.service_types || []).map((svc: any) =>
    svc.key === key ? { ...svc, label, unit, base_price } : svc
  );
  const { error: updateError } = await supabase
    .from("business_settings")
    .update({ service_types: updatedServices })
    .eq("id", data.id);
  if (updateError) throw updateError;
  return updatedServices.find((svc: any) => svc.key === key);
}

/**
 * Deletes a service from the user's service_types array.
 */
export async function deleteService(userId: string, key: string) {
  const { data, error } = await supabase
    .from("business_settings")
    .select("service_types, id")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  const updatedServices = (data?.service_types || []).filter(
    (svc: any) => svc.key !== key
  );
  const { error: updateError } = await supabase
    .from("business_settings")
    .update({ service_types: updatedServices })
    .eq("id", data.id);
  if (updateError) throw updateError;
}