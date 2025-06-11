import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function AppRoutes({ setSession }: { setSession: (s: any) => void }) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={() => setSession(true)} />} />
      <Route path="/register" element={<Register onRegistered={() => navigate("/login")} onBackToLogin={() => navigate("/login")} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      {/* Default route: always redirect to login if not matched */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  const [, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  return (
    <Router>
      <AppRoutes setSession={setSession} />
    </Router>
  );
}

export default App;