// Supabase Edge Function: createBusinessSettings
// This function inserts a new row into the business_settings table for a given user (customer_id)
// It uses the Supabase Service Role Key to bypass RLS and should be called after email confirmation.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Environment variable for Supabase Service Role Key
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { customer_id, business_name } = body;
  if (!customer_id) {
    return new Response(JSON.stringify({ error: "Missing customer_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Insert into business_settings
  const response = await fetch(`${SUPABASE_URL}/rest/v1/business_settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      customer_id,
      business_name: business_name || null,
      // Add other default fields as needed
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return new Response(JSON.stringify({ error: data.message || "Insert failed" }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, business_settings: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
