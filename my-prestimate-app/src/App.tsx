import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./components/Login"; // Adjust path if needed
import Dashboard from "./components/Dashboard"; // Or your main app component

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  if (!session) {
    return <Login />;
  }

  return <Dashboard />;
}

export default App;