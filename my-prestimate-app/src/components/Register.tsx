console.log("Register component loaded");
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
    // Automation: On every mount, check for expired trial and block features if needed
    async function checkTrialExpiry() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: customer } = await supabase
        .from('customers')
        .select('created_at, subscription_active, subscription_tier')
        .eq('id', user.id)
        .single();
      if (customer?.created_at && customer.subscription_active) {
        const created = new Date(customer.created_at);
        const now = new Date();
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 30 && customer.subscription_tier === 'Pro') {
          // Block all features by setting subscription_active to false
          await supabase
            .from('customers')
            .update({ subscription_active: false })
            .eq('id', user.id);
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
    // Normalize email before sign up
    const normalizedEmail = email.trim().toLowerCase();
    console.log("[Register] Attempting sign up", { email: normalizedEmail, password });
    try {
      const { error, data } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: "https://prestimate-frontend.vercel.app/dashboard"
        }
      });
      console.log("[Register] signUp response", { error, data });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        // After successful registration, update the customers table to set auth_id for the row with the matching stripe_customer_id (or email as fallback).
        if (data?.user?.id) {
          // Try to find the customer by email (if stripe_customer_id is not available at this point)
          // Reason: Stripe customer may have been created before registration, so we link them now.
          const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id, stripe_customer_id, auth_id, email')
            .or(`email.eq.${normalizedEmail}`)
            .maybeSingle();
          if (customer && !customer.auth_id) {
            // Update the customer row to set auth_id
            const { error: updateError } = await supabase
              .from('customers')
              .update({ auth_id: data.user.id })
              .eq('id', customer.id);
            if (updateError) {
              setError("Registration succeeded, but failed to link customer record: " + updateError.message);
              return;
            }
          }
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

  console.log("Rendering Register form");
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