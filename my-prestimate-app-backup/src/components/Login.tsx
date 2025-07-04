import React, { useState } from "react";
import { Paper, Title, TextInput, PasswordInput, Button, Center, Group } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        navigate('/dashboard');
      } else {
        setError(error.message);
      }
    } catch (err) {
      setError("Unexpected error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <Center style={{ minHeight: "100vh" }}>
      <Paper shadow="xs" p="xl" radius="md" withBorder style={{ minWidth: 350, maxWidth: 380 }}>
        <Title order={2} style={{ marginBottom: 8, textAlign: "center" }}>
          Login to Prestimate
        </Title>
        <form onSubmit={handleLogin}>
          <TextInput
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ marginBottom: 8 }}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ marginBottom: 16 }}
          />
          <Button type="submit" fullWidth>
            Login
          </Button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{error}</div>}
        <Group justify="center" mt={16}>
          <Link to="/register" style={{ textDecoration: "none" }}>
            <Button variant="subtle" color="blue">
              Don't have an account? Sign Up
            </Button>
          </Link>
        </Group>
      </Paper>
    </Center>
  );
};

export default Login;