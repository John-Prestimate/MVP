import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Box, Button, TextInput, Title, Paper, Text } from "@mantine/core";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. Sign up the user using Supabase Auth, do NOT insert into any tables yet
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      // 2. Generate dashboard activation link
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const dashboardLink = `${window.location.origin}/dashboard/activate?email=${encodeURIComponent(email)}&token=${token}`;

      // 3. Send confirmation email with the dashboard link
      const resendRes = await fetch('/api/send-onboarding-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          dashboardLink,
        }),
      });
      const result = await resendRes.json();
      if (!resendRes.ok || !result.success) throw new Error('Failed to send confirmation email');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
        padding: '24px',
      }}
    >
      <Paper
        shadow="xl"
        p={48}
        style={{
          maxWidth: 420,
          width: '100%',
          borderRadius: 32,
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          background: '#fff',
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Title order={2} style={{ fontSize: 32, textAlign: 'center', color: '#213547', marginBottom: 16 }}>
          Sign Up for Prestimate
        </Title>
        {success ? (
          <Text color="green" style={{ fontSize: 20, textAlign: 'center', marginBottom: 8 }}>
            Sign up successful! Please check your email for a secure link to activate your account and access your dashboard.
          </Text>
        ) : (
          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              gap: 24,
              marginTop: 8,
            }}
            onSubmit={handleSubmit}
          >
            <TextInput
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              size="xl"
              styles={{
                input: {
                  fontSize: 20,
                  padding: '18px',
                  borderRadius: 16,
                  boxShadow: '0 2px 8px rgba(45,127,249,0.06)',
                  border: '1px solid #dbeafe',
                  background: '#f8fafc',
                },
                label: {
                  fontSize: 18,
                  marginBottom: 6,
                  color: '#213547',
                  fontWeight: 600,
                },
              }}
            />
            <TextInput
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              size="xl"
              styles={{
                input: {
                  fontSize: 20,
                  padding: '18px',
                  borderRadius: 16,
                  boxShadow: '0 2px 8px rgba(45,127,249,0.06)',
                  border: '1px solid #dbeafe',
                  background: '#f8fafc',
                },
                label: {
                  fontSize: 18,
                  marginBottom: 6,
                  color: '#213547',
                  fontWeight: 600,
                },
              }}
            />
            <Button
              type="submit"
              size="xl"
              fullWidth
              loading={loading}
              styles={{
                root: {
                  fontSize: 22,
                  padding: '18px 0',
                  borderRadius: 16,
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  marginTop: 8,
                  boxShadow: '0 2px 12px rgba(37,99,235,0.10)',
                  transition: 'background 0.2s',
                },
              }}
              disabled={!email || !password}
            >
              {loading ? 'Signing Up...' : 'Start Free Trial'}
            </Button>
            {error && (
              <Text color="red" style={{ fontSize: 16, textAlign: 'center', marginTop: 8 }}>{error}</Text>
            )}
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default SignUp;