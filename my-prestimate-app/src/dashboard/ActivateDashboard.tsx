import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader, Paper, Title, Button, Text, Center } from "@mantine/core";
import { supabase } from "../supabaseClient";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ActivateDashboard: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const email = query.get("email") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const activate = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if user is authenticated
        let { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          // Prompt login if not authenticated
          const { error: signInError } = await supabase.auth.signInWithOtp({ email });
          if (signInError) throw signInError;
          // Re-fetch user
          ({ data: userData, error: userError } = await supabase.auth.getUser());
          if (userError || !userData?.user) throw userError || new Error("Authentication failed.");
        }
        const uid = userData.user.id;
        // Check for existing customer
        const { data: customerRows, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("auth_id", uid)
          .eq("email", email);
        if (customerError) throw customerError;
        if (customerRows.length === 0) {
          const { error: insertCustomerError } = await supabase
            .from("customers")
            .insert([{ auth_id: uid, email }]);
          if (insertCustomerError) throw insertCustomerError;
        }
        // Check for existing business_settings
        const { data: settingsRows, error: settingsError } = await supabase
          .from("business_settings")
          .select("id")
          .eq("user_id", uid);
        if (settingsError) throw settingsError;
        if (settingsRows.length === 0) {
          const { error: insertSettingsError } = await supabase
            .from("business_settings")
            .insert([{ user_id: uid, email }]);
          if (insertSettingsError) throw insertSettingsError;
        }
        setSuccess(true);
      } catch (err: any) {
        setError(err.message || "Activation failed. Please try again or contact support.");
      } finally {
        setLoading(false);
      }
    };
    activate();
    // eslint-disable-next-line
  }, []);

  return (
    <Center style={{ minHeight: "80vh" }}>
      <Paper shadow="md" radius="lg" p="xl" style={{ minWidth: 360, maxWidth: 420 }}>
        {loading ? (
          <Center>
            <Loader size="xl" />
            <Text mt="md">Activating your account...</Text>
          </Center>
        ) : error ? (
          <>
            <Title order={3} mb="md" style={{ color: 'red' }}>Activation Error</Title>
            <Text color="red" mb="md">{error}</Text>
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
          </>
        ) : success ? (
          <>
            <Title order={2} mb="md" style={{ color: 'green' }}>Welcome to Prestimate!</Title>
            <Text mb="md">Your account has been activated. You can now proceed to your dashboard.</Text>
            <Button size="lg" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </>
        ) : null}
      </Paper>
    </Center>
  );
};

export default ActivateDashboard;
