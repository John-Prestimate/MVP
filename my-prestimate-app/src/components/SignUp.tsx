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
        // 2. Insert customer row for RLS compliance
        const { error: customerInsertError } = await supabase
          .from("customers")
          .insert([
            {
              id: userId,
              email,
              company_name: companyName,
              created_at: new Date().toISOString(),
            },
          ]);
        if (customerInsertError) throw customerInsertError;
        // 3. Send onboarding email
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
    <Box style={{ maxWidth: 400, margin: "40px auto" }}>
      <Paper shadow="xs" p="md">
        <Stack gap="md">
          <Title order={3}>Sign Up for Prestimate</Title>
          {success ? (
            <Text color="green">
              Sign up successful! Please check your email to confirm your account and access your dashboard.
            </Text>
          ) : (
            <>
              <TextInput
                label="Email"
                value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Company Name"
                value={companyName}
                onChange={e => setCompanyName(e.currentTarget.value)}
                required
              />
              <Button onClick={handleSignUp} loading={loading} disabled={!email || !password || !companyName}>
                Sign Up
              </Button>
              {error && <Text color="red">{error}</Text>}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default SignUp;
