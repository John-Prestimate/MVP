import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Group,
  Stack,
  Center,
  Alert,
  Space,
} from "@mantine/core";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";

const Login = () => {
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
    setLoading(false);
    if (error) {
      setError(error.message);
      setPassword("");
    } else if (data?.session) {
      navigate("/dashboard");
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
    <Center style={{ minHeight: "100vh" }}>
      <Paper
        shadow="xs"
        p="xl"
        radius="md"
        withBorder
        style={{ minWidth: 350, width: "100%", maxWidth: 380, background: "#fff" }}
      >
        <Stack gap="xs">
          <Title order={2} ta="center" mb="sm">
            Login to Prestimate
          </Title>
          <form onSubmit={handleLogin}>
            <Stack gap="xs">
              <TextInput
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                autoComplete="username"
                onChange={e => setEmail(e.target.value)}
                disabled={loading || magicLoading}
                required
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                value={password}
                autoComplete="current-password"
                onChange={e => setPassword(e.target.value)}
                disabled={loading || magicLoading}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={magicLoading || !email.trim() || !password}
                fullWidth
                mt="md"
              >
                Login
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt="sm" gap={4}>
            <Text c="dimmed" size="sm">
              or
            </Text>
          </Group>

          <form onSubmit={handleMagicLink}>
            <Button
              type="submit"
              variant="outline"
              color="blue"
              fullWidth
              loading={magicLoading}
              disabled={loading || !email.trim()}
              mt="xs"
            >
              Send Magic Link
            </Button>
          </form>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              mt="md"
              withCloseButton
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {info && (
            <Alert
              icon={<IconCheck size={16} />}
              color="green"
              mt="md"
              withCloseButton
              onClose={() => setInfo(null)}
            >
              {info}
            </Alert>
          )}

          <Space h="sm" />
          <Center>
            <Button
              variant="subtle"
              color="blue"
              onClick={() => navigate("/register")}
              disabled={loading || magicLoading}
              size="compact-sm"
            >
              Don't have an account? Sign Up
            </Button>
          </Center>
        </Stack>
      </Paper>
    </Center>
  );
};

export default Login;