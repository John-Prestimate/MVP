import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

type RegisterProps = {
  onRegistered?: () => void;
  onBackToLogin?: () => void;
};

const Register = ({ onRegistered, onBackToLogin }: RegisterProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("Still on register after 1s");
    }, 1000);
    async function checkTrialExpiry() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: customer } = await supabase
        .from('customers')
        .select('created_at, subscription_active, subscription_tier')
        .eq('auth_id', user.id)
        .single();
      if (customer?.created_at && customer.subscription_active) {
        const created = new Date(customer.created_at);
        const now = new Date();
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 30 && customer.subscription_tier === 'Pro') {
          await supabase
            .from('customers')
            .update({ subscription_active: false })
            .eq('auth_id', user.id);
        }
      }
    }
    checkTrialExpiry();
    return () => clearTimeout(timeout);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error, data } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: "https://prestimate-frontend.vercel.app/dashboard"
        }
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }

      if (data?.user?.id) {
        // Use the database helper to upsert customer atomically
        const { data: upserted, error: upsertError } = await supabase.rpc('upsert_customer', {
          p_email: normalizedEmail,
          p_auth_id: data.user.id,
          p_name: data.user.user_metadata?.name || null,
          p_subscription_active: true,
          p_subscription_tier: 'Pro'
        });

        if (upsertError) {
          setError("Database error saving new user: " + upsertError.message);
          return;
        }

        setSuccess("Registration successful! Check your email for a confirmation link.");
        if (onRegistered) onRegistered();
      }
    } catch (err) {
      setLoading(false);
      setError("Unexpected error: " + (err instanceof Error ? err.message : String(err)));
      console.error("[Register] Unexpected error", err);
    }
  };

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      navigate("/login");
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
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button
          onClick={handleBackToLogin}
          style={{ background: "none", color: "#0b80ff", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default Register;