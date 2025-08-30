import { useEffect, useState } from "react";
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
  FileInput,
  Text as MantineText,
} from "@mantine/core";
import { fetchServices, addService, updateService, deleteService } from "../api/services";
import { supabase } from "../supabaseClient";
import { ensureBusinessSettings } from "../api/ensureBusinessSettings";
import EstimateUsageDashboard from './EstimateUsageDashboard';

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
  // Company info states
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Ensure business profile and customer row exist after login
  useEffect(() => {
    async function ensureProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[Dashboard] Current user:", user);
      if (!user) {
        console.log("[Dashboard] No authenticated user. Skipping profile insert.");
        return;
      }
      const userId = user.id;

      // Check business_settings
      const { data: existing, error: fetchError } = await supabase
        .from("business_settings")
        .select("user_id")
        .eq("user_id", userId)
        .single();
      if (fetchError && fetchError.code !== "PGRST116") return;
      if (!existing) {
        console.log("[Dashboard] Inserting business_settings for user:", userId);
        await supabase
          .from("business_settings")
          .insert({ user_id: userId, company_name: companyName });
      }

      // Check customers
      const { data: customerRow, error: customerFetchError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", userId)
        .single();
      if (customerFetchError && customerFetchError.code !== "PGRST116") return;
      if (!customerRow) {
        console.log("[Dashboard] Inserting customers row for user:", userId);
        await supabase
          .from("customers")
          .insert({ id: userId, created_at: new Date().toISOString(), subscription_active: false });
      }
    }
    ensureProfile();
  }, [companyName]);
  // Service states
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newUnit, setNewUnit] = useState("ft²");
  const [newBasePrice, setNewBasePrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  // --- Subscription status logic ---
  const [customer, setCustomer] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  useEffect(() => {
    async function fetchCustomer() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingCustomer(false);
        return;
      }
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single();
      setCustomer(data);
      setLoadingCustomer(false);
    }
    fetchCustomer();
  }, []);

  // Helper: trial status
  function trialInfo() {
    if (!customer || !customer.created_at) return { isTrial: false, trialDaysLeft: 0 };
    const created = new Date(customer.created_at);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    const trialDaysLeft = Math.max(0, 30 - Math.floor(diffDays));
    return { isTrial: diffDays <= 30, trialDaysLeft };
  }
  const { isTrial, trialDaysLeft } = trialInfo();
  const isSubscriptionActive = customer && customer.subscription_active === true;
  const trialEnded = customer && !isTrial && !isSubscriptionActive;

  // Load company info and logo
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data?.user?.id ?? null;
      setUserId(id);
      if (id) {
        await ensureBusinessSettings(id);
        // Fetch company info
        const { data: settings, error: settingsError } = await supabase
          .from('business_settings')
          .select('company_name, address, phone, email, industry, logo_url')
          .eq('user_id', id)
          .single();
        if (!settingsError && settings) {
          setCompanyName(settings.company_name || "");
          setAddress(settings.address || "");
          setPhone(settings.phone || "");
          setEmail(settings.email || "");
          setIndustry(settings.industry || "");
          setLogoUrl(settings.logo_url || null);
        }
      }
    });
  }, []);

  // Load services
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

  // Save company info
  const handleSaveCompanyInfo = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('business_settings')
      .update({
        company_name: companyName,
        address,
        phone,
        email,
        industry,
      })
      .eq('user_id', userId);
    if (error) alert("Error saving company info: " + error.message);
    else alert("Company info saved!");
  };

  // Handle logo upload
  const handleLogoUpload = async () => {
    if (!userId || !logoFile) return;
    const fileExt = logoFile.name.split('.').pop();
    const filePath = `logos/${userId}.${fileExt}`;
    let { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, logoFile, { upsert: true });
    if (uploadError) {
      alert("Error uploading logo: " + uploadError.message);
      return;
    }
    // Get public URL
    const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    setLogoUrl(publicUrl);

    // Save URL in settings
    const { error } = await supabase
      .from('business_settings')
      .update({ logo_url: publicUrl })
      .eq('user_id', userId);
    if (error) {
      alert("Error saving logo URL: " + error.message);
    }
  };

  // Service handlers
  const handleAddService = async () => {
    if (!userId || !newLabel.trim()) return;
    setLoading(true);
    const newKey = generateKey(newLabel);
    try {
      await addService(userId, newKey, newLabel.trim(), newUnit, newBasePrice);
      const data = await fetchServices(userId);
      setServices(data as Service[]);
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
      const data = await fetchServices(userId);
      setServices(data as Service[]);
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
    <>
      {/* Show logo at the top if it exists */}
      {logoUrl && (
        <div style={{ width: '100%', textAlign: 'center', marginBottom: 24 }}>
          <img src={logoUrl} alt="Company Logo" style={{ maxHeight: 100, maxWidth: 220, objectFit: 'contain' }} />
        </div>
      )}
      <Group align="flex-start" gap="xl" style={{ padding: 32 }}>
        {/* Sidebar */}
        <Paper shadow="xs" p="md" style={{ minWidth: 280 }}>
          <Stack gap="md">
            <Title order={4}>Company Name</Title>
            <TextInput
              label="Company Name"
              placeholder="Your company"
              value={companyName}
              onChange={(e) => setCompanyName(e.currentTarget.value)}
            />
            <TextInput
              label="Address"
              placeholder="123 Main St"
              value={address}
              onChange={(e) => setAddress(e.currentTarget.value)}
            />
            <TextInput
              label="Phone #"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
            <TextInput
              label="Email"
              placeholder="company@email.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <TextInput
              label="Service Industry"
              placeholder="e.g., Cleaning"
              value={industry}
              onChange={(e) => setIndustry(e.currentTarget.value)}
            />
            {/* Logo upload */}
            <FileInput
              label="Company Logo"
              placeholder="Upload logo"
              accept="image/*"
              value={logoFile}
              onChange={setLogoFile}
            />
            <MantineText size="xs" color="dimmed">
              Recommended: PNG or JPEG, approx. <b>300×100px</b>, under <b>500 KB</b>. The smaller the file size, the better for users.
            </MantineText>
            <Button
              onClick={handleLogoUpload}
              disabled={!logoFile}
              variant="light"
              color="indigo"
            >
              Upload Logo
            </Button>
            <Divider my="sm" />
            {/* Estimate usage for business user */}
            {userId && <EstimateUsageDashboard userId={userId} />}
            <Button variant="filled" color="green" onClick={handleSaveCompanyInfo}>
              Save Company Info
            </Button>
            <Button variant="outline" color="blue" onClick={() => {}}>
              Change Password
            </Button>
          </Stack>
        </Paper>

        {/* Main Content */}
        <Box style={{ flex: 1, maxWidth: 600 }}>
          <Stack gap="lg">
            {/* --- Trial Ended & Trial Nearing End Message & Upgrade Options --- */}
            {loadingCustomer ? (
              <Text>Loading subscription status...</Text>
            ) : trialEnded ? (
              <Paper shadow="xs" p="md" mb="md" style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
                <Title order={4}>
                  <Text color="#d48806" span>Your free trial has ended</Text>
                </Title>
                <Text color="#d48806" mb="sm">
                  To continue using Prestimate, please upgrade to a paid plan below. All features are currently blocked.
                </Text>
                <Group>
                  <Button color="blue" variant="filled" component="a" href="https://buy.stripe.com/test_8wM8yQ7wA7gQeRa6oo" target="_blank">
                    Upgrade to Pro
                  </Button>
                  <Button color="gray" variant="outline" component="a" href="https://buy.stripe.com/test_3cs7vQ7wA7gQeRa7op" target="_blank">
                    Choose Basic Plan
                  </Button>
                </Group>
              </Paper>
            ) : isTrial && trialDaysLeft <= 5 ? (
              <Paper shadow="xs" p="md" mb="md" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                <Title order={4}>
                  <Text color="#1890ff" span>Your free trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'}</Text>
                </Title>
                <Text color="#1890ff" mb="sm">
                  To avoid interruption, please upgrade to a paid plan below.
                </Text>
                <Group>
                  <Button color="blue" variant="filled" component="a" href="https://buy.stripe.com/test_8wM8yQ7wA7gQeRa6oo" target="_blank">
                    Upgrade to Pro
                  </Button>
                  <Button color="gray" variant="outline" component="a" href="https://buy.stripe.com/test_3cs7vQ7wA7gQeRa7op" target="_blank">
                    Choose Basic Plan
                  </Button>
                </Group>
              </Paper>
            ) : null}
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
            {/* --- Widget Embed Instructions Section --- */}
            {userId && (
              <Paper shadow="xs" p="md" mb="md" style={{ background: '#f8f9fa' }}>
                <Title order={5} mb="xs">Widget Embed Instructions</Title>
                <Text mb="xs">
                  You can embed the Prestimate measuring tool using either method below. For full platform-specific tutorials, see <a href="https://prestimate.io/how-to-embed" target="_blank" rel="noopener noreferrer">How to Embed</a>.
                </Text>
                <Text fw={500} mt="sm">1. Iframe Embed (Recommended)</Text>
                <Paper withBorder p="sm" style={{ background: '#fff', fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all', marginBottom: 8 }}>
                  {`<iframe src="https://prestimate-frontend.vercel.app/embed?id=${userId}" width="100%" height="600" style="border:none;"></iframe>`}
                </Paper>
                <Button
                  mt={0}
                  size="xs"
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src=\"https://prestimate-frontend.vercel.app/embed?id=${userId}\" width=\"100%\" height=\"600\" style=\"border:none;\"></iframe>`);
                  }}
                  variant="outline"
                  style={{ marginBottom: 12 }}
                >
                  Copy Iframe Code
                </Button>
                <Text fw={500} mt="sm">2. Script Embed (Advanced/custom use)</Text>
                <Paper withBorder p="sm" style={{ background: '#fff', fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all', marginBottom: 8 }}>
                  {`<script src="https://prestimate-frontend.vercel.app/widget.js" data-customer="${userId}"></script>`}
                </Paper>
                <Button
                  mt={0}
                  size="xs"
                  onClick={() => {
                    navigator.clipboard.writeText(`<script src=\"https://prestimate-frontend.vercel.app/widget.js\" data-customer=\"${userId}\"></script>`);
                  }}
                  variant="outline"
                >
                  Copy Script Code
                </Button>
                <Text mt="md" size="sm" color="dimmed">
                  For step-by-step guides for WordPress, Wix, Squarespace, Shopify, Webflow, GoDaddy, and more, visit <a href="https://prestimate.io/how-to-embed" target="_blank" rel="noopener noreferrer">prestimate.io/how-to-embed</a>.
                </Text>
              </Paper>
            )}
            {error && <Text style={{ color: "red" }}>{error}</Text>}
          </Stack>
        </Box>
      </Group>
    </>
  );
};

export default Dashboard;