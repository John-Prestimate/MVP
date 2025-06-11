import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import Register from "./Register";

const Login = ({ onLogin }: { onLogin?: () => void }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (onLogin) {
      onLogin();
    } else {
      window.location.reload();
    }
  };

  // Optionally: Magic Link login
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setError("Magic link sent! Check your email.");
    }
  };

  if (showRegister) {
    return (
      <div>
        <Register onRegistered={() => setShowRegister(false)} />
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button onClick={() => setShowRegister(false)} style={{ background: "none", color: "#0b80ff", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 350, margin: "60px auto", padding: 24, border: "1px solid #e0e7ef", borderRadius: 8, background: "#fff" }}>
      <h2>Login to Prestimate</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, fontSize: 16, background: "#0b80ff", color: "#fff", border: "none", borderRadius: 4 }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div style={{ margin: "18px 0 6px 0", textAlign: "center", color: "#888" }}>
        or
      </div>
      <form onSubmit={handleMagicLink}>
        <button type="submit" disabled={loading || !email} style={{ width: "100%", padding: 10, fontSize: 16, background: "#f6f7fa", color: "#0b80ff", border: "1px solid #0b80ff", borderRadius: 4 }}>
          {loading ? "Sending magic link..." : "Send Magic Link"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 14, textAlign: "center" }}>{error}</div>}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button onClick={() => setShowRegister(true)} style={{ background: "none", color: "#0b80ff", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Don't have an account? Sign Up
        </button>
      </div>
    </div>
  );
};

export default Login;