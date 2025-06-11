import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const Register = ({ onRegistered }: { onRegistered?: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Registration successful! Check your email for a confirmation link.");
      if (onRegistered) onRegistered();
    }
  };

  return (
    <div style={{ maxWidth: 350, margin: "60px auto", padding: 24, border: "1px solid #e0e7ef", borderRadius: 8, background: "#fff" }}>
      <h2>Sign Up for Prestimate</h2>
      <form onSubmit={handleRegister}>
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
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 14, textAlign: "center" }}>{error}</div>}
      {success && <div style={{ color: "green", marginTop: 14, textAlign: "center" }}>{success}</div>}
    </div>
  );
};

export default Register;