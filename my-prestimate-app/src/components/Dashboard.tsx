import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Group,
  Select,
  Text,
  TextInput,
  Title,
  Paper,
  Stack,
  Divider,
  NumberInput,
} from "@mantine/core";
import { fetchServices, addService, updateService, deleteService } from "../api/services";
import { supabase } from "../supabaseClient";
import { ensureBusinessSettings } from "../api/ensureBusinessSettings"; // <-- NEW IMPORT

// Type for a service
export type Service = {
  key: string;
  label: string;
  unit: string;
  base_price: number;
};

const unitOptions = [
  { value: "ft²", label: "Square Feet (ft²)" },
  { value: "m²", label: "Square Meters (m²)" },
  { value: "ft", label: "Linear Feet (ft)" },
  { value: "m", label: "Linear Meters (m)" },
];

const defaultServices: Omit<Service, "base_price">[] = [
  { key: "house", label: "House Wash", unit: "ft²" },
  { key: "roof", label: "Roof Wash", unit: "ft²" },
  { key: "driveway", label: "Driveway", unit: "ft²" },
  { key: "patio", label: "Patio", unit: "ft²" },
  { key: "deck", label: "Deck", unit: "ft²" },
  { key: "fence", label: "Fence", unit: "ft" },
];

const Dashboard = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newUnit, setNewUnit] = useState("ft²");
  const [newBasePrice, setNewBasePrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data?.user?.id ?? null;
      setUserId(id);
      if (id) {
        try {
          await ensureBusinessSettings(id);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    (async () => {
      try {
        let data;
        try {
          data = await fetchServices(userId);
        } catch (err: any) {
          // If no row exists, create it with default services
          if (err.code === "PGRST116") {
            const { error: insertError } = await supabase
              .from("business_settings")
              .insert([
                {
                  user_id: userId,
                  service_types: defaultServices.map((s) => ({ ...s, base_price: 0 })),
                },
              ]);
            if (insertError) throw insertError;
            data = await fetchServices(userId);
          } else {
            throw err;
          }
        }
        // If row exists but service_types is empty, also populate with defaults
        if (Array.isArray(data) && data.length === 0) {
          const { error: updateError } = await supabase
            .from("business_settings")
            .update({ service_types: defaultServices.map((s) => ({ ...s, base_price: 0 })) })
            .eq("user_id", userId);
          if (updateError) throw updateError;
          data = await fetchServices(userId);
        }
        setServices(data as Service[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Auto-generate key from label
  const generateKey = (label: string) =>
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleAddService = async () => {
    if (!userId || !newLabel.trim()) return;
    setLoading(true);
    const newKey = generateKey(newLabel);
    try {
      const newService = await addService(userId, newKey, newLabel.trim(), newUnit, newBasePrice);
      setServices((prev: Service[]) => [...prev, newService as Service]);
      setNewLabel("");
      setNewUnit("ft²");
      setNewBasePrice(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (key: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      await deleteService(userId, key);
      setServices((prev: Service[]) => prev.filter((s: Service) => s.key !== key));
      if (selectedService === key) setSelectedService(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async (
    key: string,
    label: string,
    unit: string,
    base_price: number
  ) => {
    if (!userId) return;
    setLoading(true);
    try {
      const updated = await updateService(userId, key, label, unit, base_price);
      setServices((prev: Service[]) =>
        prev.map((s: Service) => (s.key === key ? (updated as Service) : s))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const selected = services.find((s: Service) => s.key === selectedService);

  return (
    <Group align="flex-start" gap="xl" style={{ padding: 32 }}>
      {/* Sidebar */}
      <Paper shadow="xs" p="md" style={{ minWidth: 280 }}>
        <Stack gap="md">
          <Title order={4}>Company Name</Title>
          <TextInput label="Company Name" placeholder="Your company" />

          <TextInput label="Address" placeholder="123 Main St" />

          <TextInput label="Phone #" placeholder="(555) 123-4567" />

          <TextInput label="Email" placeholder="company@email.com" />

          <TextInput label="Service Industry" placeholder="e.g., Cleaning" />

          <Divider my="sm" />

          <Button variant="outline" color="blue" onClick={() => {}}>
            Change Password
          </Button>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Box style={{ flex: 1, maxWidth: 600 }}>
        <Stack gap="lg">
          <Title order={4}>Manage Services</Title>
          <Group gap="xs">
            <TextInput
              placeholder="Service name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.currentTarget.value)}
              style={{ flex: 2 }}
            />
            {/* Hide the key input from the user */}
            <Select
              placeholder="Unit"
              data={unitOptions}
              value={newUnit}
              onChange={(val) => setNewUnit(val || "ft²")}
              style={{ flex: 1 }}
            />
            <NumberInput
              placeholder="Price"
              value={newBasePrice}
              onChange={(val) => setNewBasePrice(Number(val) || 0)}
              min={0}
              style={{ flex: 1 }}
              prefix="$"
            />
            <Button onClick={handleAddService} loading={loading} disabled={!newLabel.trim()}>
              Add Service
            </Button>
          </Group>
          <Select
            label="Services"
            placeholder="Select a service"
            data={services.map((s: Service) => ({ value: s.key, label: s.label }))}
            value={selectedService}
            onChange={(val) => setSelectedService(val)}
            clearable
          />
          {selected && (
            <Paper shadow="xs" p="md">
              <Group style={{ justifyContent: "space-between" }}>
                <Text style={{ fontWeight: 500 }}>{selected.label}</Text>
                <Button color="red" size="xs" onClick={() => handleDeleteService(selected.key)}>
                  Delete
                </Button>
              </Group>
              <TextInput
                label="Label"
                value={selected.label}
                onChange={(e) =>
                  handleUpdateService(selected.key, e.currentTarget.value, selected.unit, selected.base_price)
                }
              />
              {/* Key is only shown as read-only for information, not editable */}
              <TextInput
                label="Key"
                value={selected.key}
                readOnly
                style={{ color: "#888" }}
                description="Key is generated automatically and cannot be edited"
              />
              <Select
                label="Unit"
                data={unitOptions}
                value={selected.unit}
                onChange={(val) =>
                  handleUpdateService(selected.key, selected.label, val || "ft²", selected.base_price)
                }
              />
              <NumberInput
                label="Price"
                value={selected.base_price}
                onChange={(val) =>
                  handleUpdateService(selected.key, selected.label, selected.unit, Number(val) || 0)
                }
                min={0}
                prefix="$"
              />
            </Paper>
          )}
          {error && <Text style={{ color: "red" }}>{error}</Text>}
        </Stack>
      </Box>
    </Group>
  );
};

export default Dashboard;