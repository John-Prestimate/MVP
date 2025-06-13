import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  Select,
  Image,
  VStack,
  useToast,
  Text,
  Stack,
  Divider,
  IconButton
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { supabase } from "../supabaseClient";

const SERVICE_OPTIONS = [
  "Roof Wash",
  "House Wash",
  "Driveway",
  "Patio",
  "Deck",
  "Fence",
];

type Service = {
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
  const [servicePrice, setServicePrice] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toast = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        setLoading(false);
        toast({ title: "Not authenticated", status: "error" });
        return;
      }
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.user.id)
        .single();
      if (error && error.code !== "PGRST116") {
        toast({ title: "Failed to load profile", description: error.message, status: "error" });
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
  }, [toast]);

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
      toast({ title: "Not authenticated", status: "error" });
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
      toast({ title: "Failed to save", description: error.message, status: "error" });
    } else {
      toast({ title: "Profile saved", status: "success" });
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
      toast({ title: "Logo upload failed", description: uploadError.message, status: "error" });
      setLogoUploading(false);
      return;
    }
    const { data } = supabase.storage.from("company-logos").getPublicUrl(filePath);
    setProfile((p) => ({ ...p, logo_url: data.publicUrl }));
    setLogoUploading(false);
    toast({ title: "Logo uploaded!", status: "success" });
  };

  const handleAddService = () => {
    const priceNum = Number(servicePrice);
    if (!selectedService || !servicePrice || isNaN(priceNum) || priceNum <= 0) {
      setErrors((e) => ({ ...e, add_service: "Select a service and enter a valid price" }));
      return;
    }
    if (profile.services.some((s) => s.name === selectedService)) {
      setErrors((e) => ({ ...e, add_service: "Service already added" }));
      return;
    }
    setProfile((p) => ({
      ...p,
      services: [...p.services, { name: selectedService, price: priceNum }],
    }));
    setServicePrice("");
    setErrors((e) => ({ ...e, add_service: "" }));
  };

  const handleRemoveService = (name: string) => {
    setProfile((p) => ({
      ...p,
      services: p.services.filter((s) => s.name !== name),
    }));
  };

  const handleChangePassword = () => {
    toast({ title: "Change Password not implemented yet", status: "info" });
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <Flex
      direction={["column", "row"]}
      maxW="950px"
      mx="auto"
      my={["6", "12"]}
      gap={10}
      p={4}
    >
      {/* Left: Company Info */}
      <Box
        bg="gray.50"
        borderRadius="md"
        p={6}
        flex={1}
        minW="270px"
        border="1px solid"
        borderColor="gray.200"
      >
        <VStack spacing={5} align="stretch">
          <Heading size="md">Profile</Heading>
          <FormControl isInvalid={!!errors.company_name}>
            <FormLabel>Company Name</FormLabel>
            <Input
              value={profile.company_name}
              onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
              placeholder="Company Name"
            />
            <FormErrorMessage>{errors.company_name}</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Address</FormLabel>
            <Input
              value={profile.address}
              onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
              placeholder="Address"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Phone #</FormLabel>
            <Input
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="Phone Number"
              type="tel"
            />
          </FormControl>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="Email"
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.service_industry}>
            <FormLabel>Service Industry</FormLabel>
            <Input
              value={profile.service_industry}
              onChange={e => setProfile(p => ({ ...p, service_industry: e.target.value }))}
              placeholder="e.g. Pressure Washing"
            />
            <FormErrorMessage>{errors.service_industry}</FormErrorMessage>
          </FormControl>
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={handleChangePassword}
            mt={4}
          >
            Change Password
          </Button>
        </VStack>
      </Box>

      {/* Right: Logo, Services, Pricing, Currency */}
      <Box
        bg="white"
        borderRadius="md"
        p={6}
        flex={1.2}
        border="1px solid"
        borderColor="gray.200"
        minW="320px"
      >
        <VStack spacing={6} align="stretch">
          {/* Logo Upload */}
          <Box textAlign="center">
            {profile.logo_url ? (
              <Image
                src={profile.logo_url}
                alt="Company Logo"
                boxSize="120px"
                objectFit="contain"
                borderRadius="md"
                mx="auto"
                border="1px solid"
                borderColor="gray.200"
              />
            ) : (
              <Box
                boxSize="120px"
                mx="auto"
                bg="gray.100"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="gray.400"
                fontSize="xl"
                border="1px solid"
                borderColor="gray.200"
              >
                Logo
              </Box>
            )}
            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              display="none"
            />
            <Button
              mt={2}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={logoUploading}
              colorScheme="blue"
              variant="ghost"
            >
              {profile.logo_url ? "Change Logo" : "Upload Logo"}
            </Button>
          </Box>

          <Divider />

          {/* Add Service */}
          <FormControl isInvalid={!!errors.add_service || !!errors.services}>
            <FormLabel>Add Service</FormLabel>
            <Flex gap={2}>
              <Select
                value={selectedService}
                onChange={e => setSelectedService(e.target.value)}
                maxW="180px"
              >
                {SERVICE_OPTIONS.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </Select>
              <Input
                type="number"
                value={servicePrice}
                onChange={e => setServicePrice(e.target.value)}
                placeholder="Price"
                maxW="100px"
                min={0}
              />
              <Button onClick={handleAddService} colorScheme="blue" variant="solid">
                Add
              </Button>
            </Flex>
            <FormErrorMessage>
              {errors.add_service || errors.services}
            </FormErrorMessage>
          </FormControl>

          {/* Services Already Added */}
          <Box>
            <Text fontWeight="bold">Services Already Added</Text>
            {profile.services.length === 0 ? (
              <Text color="gray.400" mt={2}>No services added yet.</Text>
            ) : (
              <Stack mt={2} spacing={1}>
                {profile.services.map(service => (
                  <Flex
                    key={service.name}
                    align="center"
                    justify="space-between"
                    px={2}
                    py={1}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    <Text>
                      {service.name} — {profile.currency} {service.price}
                    </Text>
                    <IconButton
                      size="sm"
                      aria-label={`Remove ${service.name}`}
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleRemoveService(service.name)}
                    />
                  </Flex>
                ))}
              </Stack>
            )}
          </Box>

          {/* Currency */}
          <FormControl isInvalid={!!errors.currency}>
            <FormLabel>Currency</FormLabel>
            <Select
              value={profile.currency}
              onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}
              maxW="140px"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </Select>
            <FormErrorMessage>{errors.currency}</FormErrorMessage>
          </FormControl>

          <Button
            colorScheme="blue"
            onClick={handleSaveProfile}
            isLoading={saving}
            size="lg"
            alignSelf="flex-end"
            mt={4}
          >
            Save Profile
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
};

export default Profile;