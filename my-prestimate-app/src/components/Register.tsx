import React, { useState } from "react";
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    try {
      // 1. Register the user with Supabase Auth
      const { error, data } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: "https://prestimate-frontend.vercel.app/dashboard" }
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }

      // 2. Only now, create the customer record with the Supabase Auth ID
      if (data?.user?.id) {
        const trialStart = new Date().toISOString();
        const trialExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        let attempts = 0;
        let upsertError = null;
        while (attempts < 3) {
          const { error: tryError } = await supabase.rpc('upsert_customer', {
            p_email: normalizedEmail,
            p_auth_id: data.user.id,
            p_name: data.user.user_metadata?.name || null,
            p_subscription_active: true,
            p_subscription_tier: 'Trial', // Start as Trial
            p_trial_start: trialStart,
            p_trial_expiry: trialExpiry
          });
          if (!tryError) {
            upsertError = null;
            break;
          }
          // Check for duplicate key error
          if (tryError.message && tryError.message.includes('duplicate key value violates unique constraint')) {
            attempts++;
            await new Promise(res => setTimeout(res, 500 * attempts)); // Wait longer each time
            continue;
          } else {
            upsertError = tryError;
            break;
          }
        }
        if (upsertError) {
          setError("Database error saving new user: " + upsertError.message);
          return;
        }


  // --- Do not insert into business_settings here; handled after login in Dashboard ---

        // --- Send onboarding email automatically ---
        try {
          const embedInstructions = `\n<div id=\"prestimate-widget\"></div>\n<script src=\"https://prestimate.io/widget.js\" data-user=\"${data.user.id}\"></script>\n`;
          await fetch('https://stripe-webhook-vercel-hazel.vercel.app/api/send-onboarding-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: normalizedEmail,
              customerId: data.user.id,
              dashboardUrl: 'https://prestimate-frontend.vercel.app/',
              embedInstructions,
            }),
          });
        } catch (err) {
          console.error('Failed to send onboarding email:', err);
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
    <div style={{
      maxWidth: 350,
      margin: "60px auto",
      padding: 24,
      border: "1px solid #e0e7ef",
      borderRadius: 8,
      background: "#fff"
    }}>
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
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            fontSize: 16,
            background: "#0b80ff",
            color: "#fff",
            border: "none",
            borderRadius: 4
          }}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 14, textAlign: "center" }}>{error}</div>}
      {success && <div style={{ color: "green", marginTop: 14, textAlign: "center" }}>{success}</div>}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button
          onClick={handleBackToLogin}
          style={{
            background: "none",
            color: "#0b80ff",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default Register;