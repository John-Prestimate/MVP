import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Login = ({ onLogin }: { onLogin?: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    console.log("Login response", { error, data });
    console.log("Session:", data.session); 
    setLoading(false);
    if (error) {
      setError(error.message);
      setPassword("");
    } else if (data?.session) {
      if (onLogin) {
        onLogin();
      } else {
        // Hard redirect to /dashboard to ensure session is picked up everywhere
        window.location.href = "/dashboard";
      }
    } else {
      setError("Login failed. Please try again.");
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setMagicLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setInfo("Magic link sent! Check your email.");
    }
  };

  return (
    <div style={{
      maxWidth: 350,
      margin: "60px auto",
      padding: 24,
      border: "1px solid #e0e7ef",
      borderRadius: 8,
      background: "#fff"
    }}>
      <h2>Login to Prestimate</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            autoComplete="username"
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, fontSize: 16 }}
            disabled={loading || magicLoading}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, fontSize: 16 }}
            disabled={loading || magicLoading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || magicLoading || !email.trim() || !password}
          style={{
            width: "100%",
            padding: 10,
            fontSize: 16,
            background: "#0b80ff",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loading || magicLoading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div style={{ margin: "18px 0 6px 0", textAlign: "center", color: "#888" }}>
        or
      </div>
      <form onSubmit={handleMagicLink}>
        <button
          type="submit"
          disabled={magicLoading || loading || !email.trim()}
          style={{
            width: "100%",
            padding: 10,
            fontSize: 16,
            background: "#f6f7fa",
            color: "#0b80ff",
            border: "1px solid #0b80ff",
            borderRadius: 4,
            cursor: magicLoading || loading || !email.trim() ? "not-allowed" : "pointer"
          }}
        >
          {magicLoading ? "Sending magic link..." : "Send Magic Link"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 14, textAlign: "center" }}>{error}</div>}
      {info && <div style={{ color: "green", marginTop: 14, textAlign: "center" }}>{info}</div>}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button
          type="button"
          onClick={() => navigate("/register")}
          style={{
            background: "none",
            color: "#0b80ff",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline"
          }}
          disabled={loading || magicLoading}
        >
          Don't have an account? Sign Up
        </button>
      </div>
    </div>
  );
};

export default Login;