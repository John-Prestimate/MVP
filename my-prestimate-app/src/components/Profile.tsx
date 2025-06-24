import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  TextInput,
  NumberInput,
  Select,
  Image,
  Stack,
  Paper,
  Title,
  Group,
  Divider,
  Text,
  Loader,
  Notification,
  rem,
} from "@mantine/core";
import { IconTrash, IconUpload, IconCheck, IconAlertCircle, IconKey } from "@tabler/icons-react";
import { supabase } from "../supabaseClient";
import { fetchServices, addService, deleteService } from "../api/services";

const SERVICE_OPTIONS = [
  "Roof Wash",
  "House Wash",
  "Driveway",
  "Patio",
  "Deck",
  "Fence",
];

type Service = {
  id?: number;
  name: string;
  price: number;
};

const initialProfile = {
  company_name: "",
  address: "",
  phone: "",
  email: "",
  service_industry: "",
  currency: "USD",
  logo_url: "",
  services: [] as Service[],
};

const Profile: React.FC = () => {
  const [profile, setProfile] = useState(initialProfile);
  const [selectedService, setSelectedService] = useState(SERVICE_OPTIONS[0]);
  const [servicePrice, setServicePrice] = useState<number | "">("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [notif, setNotif] = useState<{ color: string; message: string; icon?: React.ReactNode } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        setLoading(false);
        setNotif({ color: "red", message: "Not authenticated", icon: <IconAlertCircle size={18} /> });
        return;
      }
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.user.id)
        .single();
      if (error && error.code !== "PGRST116") {
        setNotif({ color: "red", message: error.message || "Failed to load profile", icon: <IconAlertCircle size={18} /> });
      }
      if (data) {
        setProfile({
          ...initialProfile,
          ...data,
          services: data.services || [],
        });
      }
      setLoading(false);
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchServices(userId)
      .then(data => {
        setProfile(p => ({ ...p, services: data }));
      })
      .catch(e => setNotif({ color: "red", message: e instanceof Error ? e.message : String(e), icon: <IconAlertCircle size={18} /> }))
      .finally(() => setLoading(false));
  }, [userId]);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!profile.company_name.trim()) errs.company_name = "Company name is required";
    if (!profile.email.trim()) errs.email = "Email is required";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(profile.email)) errs.email = "Invalid email";
    if (!profile.service_industry.trim()) errs.service_industry = "Service industry is required";
    if (!profile.services.length) errs.services = "Add at least one service";
    if (!profile.currency) errs.currency = "Currency required";
    return errs;
  };

  const handleSaveProfile = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      setNotif({ color: "red", message: "Not authenticated", icon: <IconAlertCircle size={18} /> });
      setSaving(false);
      return;
    }
    const updatePayload = {
      ...profile,
      services: profile.services,
      user_id: user.user.id,
    };
    const { error } = await supabase
      .from("profiles")
      .upsert([updatePayload], { onConflict: "user_id" });
    if (error) {
      setNotif({ color: "red", message: error.message || "Failed to save", icon: <IconAlertCircle size={18} /> });
    } else {
      setNotif({ color: "teal", message: "Profile saved", icon: <IconCheck size={18} /> });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      setNotif({ color: "red", message: uploadError.message || "Logo upload failed", icon: <IconAlertCircle size={18} /> });
      setLogoUploading(false);
      return;
    }
    const { data } = supabase.storage.from("company-logos").getPublicUrl(filePath);
    setProfile((p) => ({ ...p, logo_url: data.publicUrl }));
    setLogoUploading(false);
    setNotif({ color: "teal", message: "Logo uploaded!", icon: <IconCheck size={18} /> });
  };

  const handleAddService = async () => {
    if (!userId || !selectedService || !servicePrice || isNaN(Number(servicePrice)) || Number(servicePrice) <= 0) {
      setErrors((e) => ({ ...e, add_service: "Select a service and enter a valid price" }));
      return;
    }
    if (profile.services.some((s) => s.name === selectedService)) {
      setErrors((e) => ({ ...e, add_service: "Service already added" }));
      return;
    }
    // Use selectedService as label and key, and provide a default unit (e.g., 'ft²')
    const key = selectedService.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const label = selectedService;
    const unit = "ft²"; // Or allow user to select unit if you want
    const base_price = Number(servicePrice);
    try {
      await addService(userId, key, label, unit, base_price);
      // Always re-fetch services from Supabase after add
      const data = await fetchServices(userId);
      setProfile((p) => ({ ...p, services: data.map((svc: any) => ({ name: svc.label, price: svc.base_price })) }));
      setServicePrice("");
      setErrors((e) => ({ ...e, add_service: "" }));
    } catch (e) {
      setNotif({ color: "red", message: e instanceof Error ? e.message : String(e), icon: <IconAlertCircle size={18} /> });
    }
  };

  const handleRemoveService = async (name: string) => {
    if (!userId) return;
    // Find the service by name, then use its key
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      await deleteService(userId, key);
      // Always re-fetch services from Supabase after remove
      const data = await fetchServices(userId);
      setProfile((p) => ({ ...p, services: data.map((svc: any) => ({ name: svc.label, price: svc.base_price })) }));
    } catch (e) {
      setNotif({ color: "red", message: e instanceof Error ? e.message : String(e), icon: <IconAlertCircle size={18} /> });
    }
  };

  const handleChangePassword = () => {
    setNotif({ color: "blue", message: "Change Password not implemented yet", icon: <IconKey size={18} /> });
  };

  if (loading) return <Loader color="blue" style={{ margin: "2rem auto", display: "block" }} />;

  return (
    <Flex
      gap="lg"
      justify="center"
      align="flex-start"
      direction={{ base: "column", md: "row" }}
      maw={950}
      mx="auto"
      my={{ base: rem(24), md: rem(48) }}
      p="md"
    >
      {/* Left: Company Info */}
      <Paper
        withBorder
        radius="md"
        p="xl"
        flex={1}
        miw={270}
        bg="gray.0"
      >
        <Stack gap="xs">
          <Title order={3}>Profile</Title>
          <TextInput
            label="Company Name"
            value={profile.company_name}
            onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
            error={errors.company_name}
            placeholder="Company Name"
          />
          <TextInput
            label="Address"
            value={profile.address}
            onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
            placeholder="Address"
          />
          <TextInput
            label="Phone #"
            value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
            placeholder="Phone Number"
            type="tel"
          />
          <TextInput
            label="Email"
            type="email"
            value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            error={errors.email}
            placeholder="Email"
          />
          <TextInput
            label="Service Industry"
            value={profile.service_industry}
            onChange={e => setProfile(p => ({ ...p, service_industry: e.target.value }))}
            error={errors.service_industry}
            placeholder="e.g. Pressure Washing"
          />
          <Button
            leftSection={<IconKey size={16} />}
            variant="outline"
            color="blue"
            onClick={handleChangePassword}
            mt="md"
          >
            Change Password
          </Button>
        </Stack>
      </Paper>

      {/* Right: Logo, Services, Pricing, Currency */}
      <Paper
        withBorder
        radius="md"
        p="xl"
        flex={1.2}
        miw={320}
        bg="white"
      >
        <Stack gap="md">
          {/* Logo Upload */}
          <Box ta="center">
            {profile.logo_url ? (
              <Image
                src={profile.logo_url}
                alt="Company Logo"
                w={120}
                h={120}
                fit="contain"
                radius="md"
                mx="auto"
                style={{ border: "1px solid #e9ecef" }}
              />
            ) : (
              <Box
                w={120}
                h={120}
                mx="auto"
                bg="gray.1"
                style={{
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#adb5bd",
                  fontSize: 22,
                  border: "1px solid #e9ecef",
                }}
              >
                Logo
              </Box>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleLogoUpload}
            />
            <Button
              mt="xs"
              size="compact-sm"
              onClick={() => fileInputRef.current?.click()}
              loading={logoUploading}
              variant="light"
              color="blue"
              leftSection={<IconUpload size={14} />}
            >
              {profile.logo_url ? "Change Logo" : "Upload Logo"}
            </Button>
          </Box>

          <Divider />

          {/* Add Service */}
          <Box>
            <Group gap={6} align="flex-end">
              <Select
                label="Add Service"
                data={SERVICE_OPTIONS}
                value={selectedService}
                onChange={v => setSelectedService(v!)}
                w={180}
                nothingFoundMessage="No services"
              />
              <NumberInput
                label="Price"
                value={servicePrice}
                onChange={v => setServicePrice(v as number)}
                placeholder="Price"
                min={0}
                w={100}
              />
              <Button
                color="blue"
                variant="filled"
                onClick={handleAddService}
                style={{ marginBottom: 0 }}
              >
                Add
              </Button>
            </Group>
            {(errors.add_service || errors.services) && (
              <Text c="red" size="xs" mt={4}>{errors.add_service || errors.services}</Text>
            )}
          </Box>

          {/* Services Already Added */}
          <Box>
            <Text fw={500} mb={2}>Services Already Added</Text>
            {profile.services.length === 0 ? (
              <Text c="dimmed" mt={2}>No services added yet.</Text>
            ) : (
              <Stack mt={2} gap={4}>
                {profile.services.map(service => (
                  <Group
                    key={service.name}
                    align="center"
                    justify="space-between"
                    px={8}
                    py={4}
                    bg="gray.1"
                    style={{ borderRadius: 7 }}
                  >
                    <Text>
                      {service.name} — {profile.currency} {service.price}
                    </Text>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      leftSection={<IconTrash size={16} />}
                      onClick={() => handleRemoveService(service.name)}
                    >
                      Remove
                    </Button>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>

          {/* Currency */}
          <Select
            label="Currency"
            data={[
              { value: "USD", label: "USD ($)" },
              { value: "EUR", label: "EUR (€)" },
              { value: "GBP", label: "GBP (£)" },
            ]}
            value={profile.currency}
            onChange={v => setProfile(p => ({ ...p, currency: v! }))}
            w={140}
            error={errors.currency}
          />

          <Button
            color="blue"
            onClick={handleSaveProfile}
            loading={saving}
            size="md"
            mt="sm"
            style={{ alignSelf: "flex-end" }}
          >
            Save Profile
          </Button>
        </Stack>
      </Paper>
      {notif && (
        <Notification
          color={notif.color as any}
          icon={notif.icon}
          withCloseButton
          onClose={() => setNotif(null)}
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            maxWidth: 340,
          }}
        >
          {notif.message}
        </Notification>
      )}
    </Flex>
  );
};

export default Profile;