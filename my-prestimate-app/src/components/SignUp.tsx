import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextInput, Title, Paper, Stack, Text, PasswordInput } from "@mantine/core";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Example sign-up handler (replace with your actual logic)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    (async () => {
      try {
        // Insert customer into Supabase 'customers' table
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .insert([{ email, company_name: companyName }])
          .select();
        if (customerError) throw customerError;

        // Insert business settings
        const { error: settingsError } = await supabase
          .from('business_settings')
          .insert([{ email, company_name: companyName }]);
        if (settingsError) throw settingsError;

        // Generate secure dashboard link (tokenized)
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const dashboardLink = `${window.location.origin}/dashboard/activate?email=${encodeURIComponent(email)}&token=${token}`;

        // Send confirmation email via Resend API
        const resendRes = await fetch('/api/send-onboarding-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            companyName,
            dashboardLink,
          }),
        });
        if (!resendRes.ok) throw new Error('Failed to send confirmation email');

        setSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Sign up failed. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
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
          minHeight: 520,
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
              onChange={e => setEmail(e.currentTarget.value)}
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
            <PasswordInput
              label="Password"
              required
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
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
              label="Company Name"
              required
              value={companyName}
              onChange={e => setCompanyName(e.currentTarget.value)}
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
              disabled={!email || !password || !companyName}
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