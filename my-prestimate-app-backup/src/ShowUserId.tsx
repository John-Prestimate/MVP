import { useEffect } from "react";
import { supabase } from "./supabaseClient"; // Adjust path if your supabaseClient is in a different folder

export function ShowUserId() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        console.log("My Supabase User ID:", data.user.id);
      }
    });
  }, []);
  return null; // This component doesn't render anything visible
}