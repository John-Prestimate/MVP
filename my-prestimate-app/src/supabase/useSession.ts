import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useSession() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      console.log("[useSession] Initial session:", data.session); // Debug log
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      console.log("[useSession] Auth state change:", session); // Debug log
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}