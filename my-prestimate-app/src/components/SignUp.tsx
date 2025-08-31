import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextInput, Title, Paper, Stack, Text } from "@mantine/core";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (signUpError) throw signUpError;
      // Only send onboarding email if userId is available (no email confirmation required)
      const userId = data.user?.id;
      if (userId) {
        // 2. Insert customer row for RLS compliance, with trial info
        const trialStart = new Date().toISOString();
        const trialExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const { error: customerInsertError } = await supabase
          .from("customers")
          .insert([
            {
              id: userId,
              email,
              company_name: companyName,
              created_at: trialStart,
              subscription_tier: 'Trial',
              subscription_active: true,
              trial_start: trialStart,
              trial_expiry: trialExpiry,
            },
          ]);
        if (customerInsertError) throw customerInsertError;
        // 3. Insert basic business_settings row
        const { error: businessSettingsError } = await supabase
          .from("business_settings")
          .insert([
            {
              user_id: userId,
              company_name: companyName,
            },
          ]);
        if (businessSettingsError) throw businessSettingsError;
        // 4. Send onboarding email
        const dashboardUrl = `${window.location.origin}/dashboard`;
        const embedInstructions = `<iframe src=\"https://prestimate-frontend.vercel.app/embed?id=${userId}\" width=\"100%\" height=\"600\" style=\"border:none;\"></iframe>`;
        await fetch("/api/send-onboarding-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            customerId: userId,
            dashboardUrl,
            embedInstructions,
          }),
        });
      }
  setSuccess(true);
  // Redirect to dashboard after successful sign up and customer creation
  navigate("/dashboard");
    } catch (e: any) {
      setError(e.message || String(e));
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
        p={32}
        style={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 24,
          boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
          background: '#fff',
        }}
      >
        <Stack gap={24}>
          <Title order={2} style={{ fontSize: 32, textAlign: 'center', color: '#213547', marginBottom: 8 }}>
            Sign Up for Prestimate
          </Title>
          {success ? (
            <Text color="green" style={{ fontSize: 20, textAlign: 'center' }}>
              Sign up successful! Please check your email to confirm your account and access your dashboard.
            </Text>
          ) : (
            <>
              <TextInput
                label={<span style={{ fontSize: 18, color: '#213547' }}>Email</span>}
                value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                required
                size="lg"
                style={{ fontSize: 18 }}
                inputProps={{ style: { fontSize: 18, padding: '14px' } }}
              />
              <TextInput
                label={<span style={{ fontSize: 18, color: '#213547' }}>Password</span>}
                type="password"
                value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                required
                size="lg"
                style={{ fontSize: 18 }}
                inputProps={{ style: { fontSize: 18, padding: '14px' } }}
              />
              <TextInput
                label={<span style={{ fontSize: 18, color: '#213547' }}>Company Name</span>}
                value={companyName}
                onChange={e => setCompanyName(e.currentTarget.value)}
                required
                size="lg"
                style={{ fontSize: 18 }}
                inputProps={{ style: { fontSize: 18, padding: '14px' } }}
              />
              <Button
                onClick={handleSignUp}
                loading={loading}
                disabled={!email || !password || !companyName}
                size="xl"
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
              >
                Sign Up
              </Button>
              {error && (
                <Text color="red" style={{ fontSize: 16, textAlign: 'center', marginTop: 8 }}>{error}</Text>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default SignUp;
