import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
// ...existing code...
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
          .single(); // Only query, do not insert/upsert during sign-up or initial load
      if (fetchError && fetchError.code !== "PGRST116") return;
  // Ensure business_settings row exists after login, with user-friendly messages
  const [profileStatus, setProfileStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    async function ensureProfile() {
      setProfileStatus('checking');
      setProfileError("");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setProfileStatus('error');
        setProfileError("You must be logged in to access the dashboard.");
        return;
      }
      try {
        await ensureBusinessSettings(user.id);
        setProfileStatus('ready');
      } catch (err: any) {
        setProfileStatus('error');
        setProfileError(err.message || "Failed to set up your business settings.");
      }
    }
    ensureProfile();
  }, []);

  if (profileStatus === 'checking') return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><span>Loading your business profile...</span></div>;
  if (profileStatus === 'error') return <div style={{color:'red',textAlign:'center',marginTop:40}}>{profileError}</div>;
      if (!existing) {
        console.log("[Dashboard] Inserting business_settings for user:", userId);
          // ...existing code...
      }

      // Check customers
        const { data: customerRow, error: customerFetchError } = await supabase
          .from("customers")
          .select("id")
          .eq("id", userId)
          .single(); // Only query, do not insert/upsert during sign-up or initial load
      if (customerFetchError && customerFetchError.code !== "PGRST116") return;
      if (!customerRow) {
        console.log("[Dashboard] Inserting customers row for user:", userId);
          // ...existing code...
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
  const [customerId, setCustomerId] = useState<string | null>(null);
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

  // Helper: trial status (use trial_expiry if available)
  function trialInfo() {
    if (!customer || !customer.trial_expiry) return { isTrial: false, trialDaysLeft: 0 };
    const now = new Date();
    const expiry = new Date(customer.trial_expiry);
    const diffMs = expiry.getTime() - now.getTime();
    const trialDaysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { isTrial: trialDaysLeft > 0, trialDaysLeft };
  }
  const { isTrial, trialDaysLeft } = trialInfo();
  const isSubscriptionActive = customer && customer.subscription_active === true;
  const trialEnded = customer && !isTrial && !isSubscriptionActive;

  // Load company info and logo
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const authId = data?.user?.id ?? null;
      setUserId(authId);
      if (authId) {
        // Fetch customer row to get the customers.id
        const { data: customerRow } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_id', authId)
          .single();
        setCustomerId(customerRow?.id ?? null);
        await ensureBusinessSettings(authId);
        // Fetch company info
        const { data: settings, error: settingsError } = await supabase
          .from('business_settings')
          .select('company_name, address, phone, email, industry, logo_url')
          .eq('user_id', authId)
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
            // The insert code was removed, but if you restore it, use:
            // const { data, error: insertError } = await supabase.from(...).insert(...);
            // if (insertError) throw insertError;
            // ...existing code...
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
    <div className={styles["dashboard-wrapper"]}>
      {logoUrl && (
        <div style={{ width: "100%", textAlign: "center", marginBottom: 24 }}>
          <img src={logoUrl} alt="Company Logo" style={{ maxHeight: 100, maxWidth: 220, objectFit: "contain" }} />
        </div>
      )}
      <div className={styles["dashboard-main"]}>
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* Sidebar */}
          <div className={styles["dashboard-card"]} style={{ minWidth: 280, maxWidth: 340 }}>
            <div className={styles["dashboard-section"]}>
              <div className={styles["dashboard-title"]}>Company Profile</div>
              <label className={styles["dashboard-label"]}>Company Name</label>
              <input className={styles["dashboard-input"]} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company" />
              <label className={styles["dashboard-label"]}>Address</label>
              <input className={styles["dashboard-input"]} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
              <label className={styles["dashboard-label"]}>Phone #</label>
              <input className={styles["dashboard-input"]} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              <label className={styles["dashboard-label"]}>Email</label>
              <input className={styles["dashboard-input"]} value={email} onChange={e => setEmail(e.target.value)} placeholder="company@email.com" />
              <label className={styles["dashboard-label"]}>Service Industry</label>
              <input className={styles["dashboard-input"]} value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g., Cleaning" />
              <label className={styles["dashboard-label"]}>Company Logo</label>
              <input className={styles["dashboard-input"]} type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
              <div style={{ fontSize: "0.9rem", color: "#888", marginBottom: 8 }}>
                Recommended: PNG or JPEG, approx. <b>300×100px</b>, under <b>500 KB</b>.
              </div>
              <button className={styles["dashboard-button"]} onClick={handleLogoUpload} disabled={!logoFile}>Upload Logo</button>
              <div style={{ margin: "16px 0" }}>
                {userId && <EstimateUsageDashboard userId={userId} />}
              </div>
              <button className={styles["dashboard-button"]} style={{ background: "#22c55e", color: "#fff" }} onClick={handleSaveCompanyInfo}>Save Company Info</button>
              <button className={styles["dashboard-button"]} style={{ background: "#6366f1", color: "#fff" }} onClick={() => {}}>Change Password</button>
            </div>
          </div>
          {/* Main Content */}
          <div className={styles["dashboard-card"]} style={{ flex: 1, maxWidth: 600 }}>
            {/* --- Trial Ended & Trial Nearing End Message & Upgrade Options --- */}
            {loadingCustomer ? (
              <div>Loading subscription status...</div>
            ) : trialEnded ? (
              <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <div style={{ color: "#d48806", fontWeight: 700, fontSize: "1.1rem" }}>Your free trial has ended</div>
                <div style={{ color: "#d48806", marginBottom: 8 }}>To continue using Prestimate, please upgrade to a paid plan below. All features are currently blocked.</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <a href="https://buy.stripe.com/test_8wM8yQ7wA7gQeRa6oo" target="_blank" rel="noopener noreferrer" className={styles["dashboard-button"]} style={{ background: "#6366f1" }}>Upgrade to Pro</a>
                  <a href="https://buy.stripe.com/test_3cs7vQ7wA7gQeRa7op" target="_blank" rel="noopener noreferrer" className={styles["dashboard-button"]} style={{ background: "#7B5AF7" }}>Choose Basic Plan</a>
                </div>
              </div>
            ) : isTrial && trialDaysLeft <= 5 ? (
              <div style={{ background: "#e6f7ff", border: "1px solid #91d5ff", borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <div style={{ color: "#1890ff", fontWeight: 700, fontSize: "1.1rem" }}>Your free trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'}</div>
                <div style={{ color: "#1890ff", marginBottom: 8 }}>To avoid interruption, please upgrade to a paid plan below.</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <a href="https://buy.stripe.com/test_8wM8yQ7wA7gQeRa6oo" target="_blank" rel="noopener noreferrer" className={styles["dashboard-button"]} style={{ background: "#6366f1" }}>Upgrade to Pro</a>
                  <a href="https://buy.stripe.com/test_3cs7vQ7wA7gQeRa7op" target="_blank" rel="noopener noreferrer" className={styles["dashboard-button"]} style={{ background: "#7B5AF7" }}>Choose Basic Plan</a>
                </div>
              </div>
            ) : null}
            <div className={styles["dashboard-title"]}>Manage Services</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input className={styles["dashboard-input"]} placeholder="Service name" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ flex: 2 }} />
              <select className={styles["dashboard-input"]} value={newUnit} onChange={e => setNewUnit(e.target.value)} style={{ flex: 1 }}>
                {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input className={styles["dashboard-input"]} type="number" min={0} value={newBasePrice} onChange={e => setNewBasePrice(Number(e.target.value) || 0)} placeholder="Price" style={{ flex: 1 }} />
              <button className={styles["dashboard-button"]} onClick={handleAddService} disabled={!newLabel.trim() || loading}>Add Service</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <select className={styles["dashboard-input"]} value={selectedService ?? ""} onChange={e => setSelectedService(e.target.value || null)}>
                <option value="">Select a service</option>
                {services.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            {selected && (
              <div className={styles["dashboard-card"]} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>{selected.label}</span>
                  <button className={styles["dashboard-button"]} style={{ background: "#ef4444" }} onClick={() => handleDeleteService(selected.key)}>Delete</button>
                </div>
                <label className={styles["dashboard-label"]}>Label</label>
                <input className={styles["dashboard-input"]} value={selected.label} onChange={e => handleUpdateService(selected.key, e.target.value, selected.unit, selected.base_price)} />
                <label className={styles["dashboard-label"]}>Key</label>
                <input className={styles["dashboard-input"]} value={selected.key} readOnly style={{ color: "#888" }} />
                <label className={styles["dashboard-label"]}>Unit</label>
                <select className={styles["dashboard-input"]} value={selected.unit} onChange={e => handleUpdateService(selected.key, selected.label, e.target.value, selected.base_price)}>
                  {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <label className={styles["dashboard-label"]}>Price</label>
                <input className={styles["dashboard-input"]} type="number" min={0} value={selected.base_price} onChange={e => handleUpdateService(selected.key, selected.label, selected.unit, Number(e.target.value) || 0)} />
              </div>
            )}
            {/* --- Widget Embed Instructions Section --- */}
            {customerId && (
              <div className={styles["dashboard-card"]} style={{ background: "#f8f9fa", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>Widget Embed Instructions</div>
                <div style={{ marginBottom: 8 }}>
                  You can embed the Prestimate measuring tool using either method below. For full platform-specific tutorials, see <a href="https://prestimate.io/how-to-embed" target="_blank" rel="noopener noreferrer">How to Embed</a>.
                </div>
                <div style={{ fontWeight: 500, marginTop: 8 }}>Direct Map Tool Link</div>
                <div style={{ background: "#fff", fontFamily: "monospace", fontSize: 14, wordBreak: "break-all", marginBottom: 8, padding: 8, borderRadius: 8 }}>
                  <a href={`https://my-prestimate-app.vercel.app/?user=${customerId}`} target="_blank" rel="noopener noreferrer">https://my-prestimate-app.vercel.app/?user={customerId}</a>
                </div>
                <button className={styles["dashboard-button"]} style={{ background: "#ece6ff", color: "#7B5AF7", marginBottom: 8 }} onClick={() => navigator.clipboard.writeText(`https://my-prestimate-app.vercel.app/?user=${customerId}`)}>Copy Map Tool Link</button>
                <div style={{ fontWeight: 500, marginTop: 8 }}>1. Iframe Embed (Recommended)</div>
                <div style={{ background: "#fff", fontFamily: "monospace", fontSize: 14, wordBreak: "break-all", marginBottom: 8, padding: 8, borderRadius: 8 }}>
                  {`<iframe src="https://prestimate-frontend.vercel.app/embed?user=${customerId}" width="100%" height="600" style="border:none;"></iframe>`}
                </div>
                <button className={styles["dashboard-button"]} style={{ background: "#ece6ff", color: "#7B5AF7", marginBottom: 8 }} onClick={() => navigator.clipboard.writeText(`<iframe src=\"https://prestimate-frontend.vercel.app/embed?user=${customerId}\" width=\"100%\" height=\"600\" style=\"border:none;\"></iframe>`)}>Copy Iframe Code</button>
                <div style={{ fontWeight: 500, marginTop: 8 }}>2. Script Embed (Advanced/custom use)</div>
                <div style={{ background: "#fff", fontFamily: "monospace", fontSize: 14, wordBreak: "break-all", marginBottom: 8, padding: 8, borderRadius: 8 }}>
                  {`<script src="https://prestimate-frontend.vercel.app/widget.js" data-customer="${userId}"></script>`}
                </div>
                <button className={styles["dashboard-button"]} style={{ background: "#ece6ff", color: "#7B5AF7" }} onClick={() => navigator.clipboard.writeText(`<script src=\"https://prestimate-frontend.vercel.app/widget.js\" data-customer=\"${userId}\"></script>`)}>Copy Script Code</button>
                <div style={{ marginTop: 12, fontSize: "0.95rem", color: "#888" }}>
                  For step-by-step guides for WordPress, Wix, Squarespace, Shopify, Webflow, GoDaddy, and more, visit <a href="https://prestimate.io/how-to-embed" target="_blank" rel="noopener noreferrer">prestimate.io/how-to-embed</a>.
                </div>
              </div>
            )}
            {error && <div style={{ color: "red" }}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;