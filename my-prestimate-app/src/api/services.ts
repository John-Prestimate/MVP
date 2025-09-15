// WARNING: All functions in this file require a valid authenticated user/session.
// Never call from the client before login or before email confirmation.
// Supabase RLS will block unauthenticated inserts/updates.
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
  // RUNTIME GUARD: Only allow insert after user is authenticated and email is confirmed
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw userError || new Error('No user logged in');
  if (!user.email_confirmed_at) throw new Error('Email not confirmed. Cannot insert into business_settings.');
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
  // RUNTIME GUARD: Only allow insert after user is authenticated and email is confirmed
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw userError || new Error('No user logged in');
  if (!user.email_confirmed_at) throw new Error('Email not confirmed. Cannot insert into business_settings.');
  let { data, error } = await supabase
    .from("business_settings")
    .select("service_types, id")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('[addService] fetch error:', error);
    throw error;
  }

  const newService = { key, label, unit, base_price };

  if (!data) {
    // No row exists, create it with this service
    const insertPayload = {
      user_id: userId,
      service_types: [newService],
    };
    if (!Array.isArray(insertPayload.service_types)) {
      throw new Error('[addService] service_types is not an array!');
    }
    const { error: insertError } = await supabase
      .from("business_settings")
      .insert([insertPayload]);
    if (insertError) {
      console.error('[addService] insert error:', insertError, 'Payload:', insertPayload);
      throw insertError;
    }
    return newService;
  } else {
    // Row exists, update it
    const updatedServices = [...(data?.service_types || []), newService];
    if (!Array.isArray(updatedServices)) {
      throw new Error('[addService] updatedServices is not an array!');
    }
    const { error: updateError } = await supabase
      .from("business_settings")
      .update({ service_types: updatedServices })
      .eq("id", data.id);
    if (updateError) {
      console.error('[addService] update error:', updateError, 'Updated:', updatedServices);
      throw updateError;
    }
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
  if (error) {
    console.error('[updateService] fetch error:', error);
    throw error;
  }
  const updatedServices = (data?.service_types || []).map((svc: any) =>
    svc.key === key ? { ...svc, label, unit, base_price } : svc
  );
  if (!Array.isArray(updatedServices)) {
    throw new Error('[updateService] updatedServices is not an array!');
  }
  const { error: updateError } = await supabase
    .from("business_settings")
    .update({ service_types: updatedServices })
    .eq("id", data.id);
  if (updateError) {
    console.error('[updateService] update error:', updateError, 'Updated:', updatedServices);
    throw updateError;
  }
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
  if (error) {
    console.error('[deleteService] fetch error:', error);
    throw error;
  }
  const updatedServices = (data?.service_types || []).filter(
    (svc: any) => svc.key !== key
  );
  if (!Array.isArray(updatedServices)) {
    throw new Error('[deleteService] updatedServices is not an array!');
  }
  const { error: updateError } = await supabase
    .from("business_settings")
    .update({ service_types: updatedServices })
    .eq("id", data.id);
  if (updateError) {
    console.error('[deleteService] update error:', updateError, 'Updated:', updatedServices);
    throw updateError;
  }
}