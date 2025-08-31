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
          maxWidth: 700,
          width: '100%',
          borderRadius: 32,
          boxShadow: '0 8px 48px rgba(0,0,0,0.12)',
          background: '#fff',
          minHeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Title order={2} style={{ fontSize: 32, textAlign: 'center', color: '#213547', marginBottom: 8 }}>
          Sign Up for Prestimate
        </Title>
        {success ? (
          <Text color="green" style={{ fontSize: 20, textAlign: 'center' }}>
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
              maxWidth: 440,
              gap: 28,
            }}
            onSubmit={handleSubmit}
          >
            <Stack gap={28} style={{ width: '100%' }}>
              <TextInput
                label={<span style={{ fontSize: 18, color: '#213547' }}>Email</span>}
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                size="lg"
                styles={{
                  input: {
                    fontSize: 18,
                    padding: '14px',
                  },
                  label: {
                    fontSize: 18,
                  },
                }}
              />
              <PasswordInput
                label={<span style={{ fontSize: 18, color: '#213547' }}>Password</span>}
                required
                value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                size="lg"
                styles={{
                  input: {
                    fontSize: 18,
                    padding: '14px',
                  },
                  label: {
                    fontSize: 18,
                  },
                }}
              />
              <TextInput
                label={<span style={{ fontSize: 18, color: '#213547' }}>Company Name</span>}
                required
                value={companyName}
                onChange={e => setCompanyName(e.currentTarget.value)}
                size="lg"
                styles={{
                  input: {
                    fontSize: 18,
                    padding: '14px',
                  },
                  label: {
                    fontSize: 18,
                  },
                }}
              />
              <Button
                type="submit"
                size="xl"
                fullWidth
                loading={loading}
                style={{
                  fontSize: 22,
                  padding: '16px 0',
                  borderRadius: 12,
                  background: '#2d7ff9',
                  color: '#fff',
                  fontWeight: 600,
                  marginTop: 8,
                  boxShadow: '0 2px 8px rgba(45,127,249,0.08)',
                }}
                disabled={!email || !password || !companyName}
              >
                {loading ? 'Signing Up...' : 'Start Free Trial'}
              </Button>
              {error && (
                <Text color="red" style={{ fontSize: 16, textAlign: 'center', marginTop: 8 }}>{error}</Text>
              )}
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default SignUp;