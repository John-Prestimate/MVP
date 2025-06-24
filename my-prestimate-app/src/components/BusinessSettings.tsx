import React, { useEffect, useState } from 'react';
import { getBusinessSettings, updateBusinessSettings } from '../api/businessSettings';
import { fetchServices, addService, deleteService } from '../api/services';
import { supabase } from '../supabaseClient';
import { ensureBusinessSettings } from '../api/ensureBusinessSettings'; // <-- NEW IMPORT

// Editable default for adding new services
const DEFAULT_NEW_SERVICE = {
  key: '',
  label: '',
  base_price: 0,
  unit: 'ft²',
};

function BusinessSettings() {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // For editing services
  const [services, setServices] = useState<any[]>([]);
  const [serviceEdit, setServiceEdit] = useState<any>(DEFAULT_NEW_SERVICE);
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
    fetchServices(userId)
      .then(data => setServices(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    getBusinessSettings()
      .then(data => {
        setForm(data || {});
        setServices(data?.service_types || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Service field change
  const handleServiceChange = (idx: number, field: string, value: string | number) => {
    const newServices = [...services];
    newServices[idx] = { ...newServices[idx], [field]: value };
    setServices(newServices);
  };

  const handleRemoveService = async (idx: number) => {
    if (!userId) return;
    const svc = services[idx];
    try {
      await deleteService(userId, svc.key); // Use key, not id
      // Always re-fetch services from Supabase after remove
      const data = await fetchServices(userId);
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddService = async () => {
    if (!userId || !serviceEdit.key || !serviceEdit.label || !serviceEdit.unit || serviceEdit.base_price === undefined) return;
    try {
      await addService(
        userId,
        serviceEdit.key,
        serviceEdit.label,
        serviceEdit.unit,
        Number(serviceEdit.base_price)
      );
      // Always re-fetch services from Supabase after add
      const data = await fetchServices(userId);
      setServices(data);
      setServiceEdit(DEFAULT_NEW_SERVICE);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditServiceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServiceEdit({ ...serviceEdit, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateBusinessSettings({ ...form, service_types: services });
      setSuccess("Settings updated!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading business settings...</div>;
  if (error) return <div style={{color: "red"}}>Error: {error}</div>;

  return (
    <form onSubmit={handleSubmit} style={{marginBottom: "2em"}}>
      <h3>Business Settings</h3>
      <div>
        <label>
          Currency:
          <input
            name="currency"
            value={form.currency || ''}
            onChange={handleChange}
            type="text"
          />
        </label>
      </div>
      <div>
        <label>
          Units:
          <input
            name="units"
            value={form.units || ''}
            onChange={handleChange}
            type="text"
          />
        </label>
      </div>
      <br />
      <h4>Service Types</h4>
      <table style={{ borderCollapse: "collapse", marginBottom: 8 }}>
        <thead>
          <tr>
            <th style={{border: "1px solid #ccc", padding: 4}}>Key</th>
            <th style={{border: "1px solid #ccc", padding: 4}}>Label</th>
            <th style={{border: "1px solid #ccc", padding: 4}}>Base Price</th>
            <th style={{border: "1px solid #ccc", padding: 4}}>Unit</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc, idx) => (
            <tr key={idx}>
              <td style={{border: "1px solid #ccc", padding: 4}}>
                <input
                  value={svc.key}
                  onChange={e => handleServiceChange(idx, "key", e.target.value)}
                  style={{ width: 80 }}
                />
              </td>
              <td style={{border: "1px solid #ccc", padding: 4}}>
                <input
                  value={svc.label}
                  onChange={e => handleServiceChange(idx, "label", e.target.value)}
                  style={{ width: 130 }}
                />
              </td>
              <td style={{border: "1px solid #ccc", padding: 4}}>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={svc.base_price}
                  onChange={e => handleServiceChange(idx, "base_price", parseFloat(e.target.value))}
                  style={{ width: 80 }}
                />
              </td>
              <td style={{border: "1px solid #ccc", padding: 4}}>
                <input
                  value={svc.unit}
                  onChange={e => handleServiceChange(idx, "unit", e.target.value)}
                  style={{ width: 60 }}
                />
              </td>
              <td>
                <button type="button" style={{ color: "red" }} onClick={() => handleRemoveService(idx)}>Delete</button>
              </td>
            </tr>
          ))}
          {/* Row for adding new service */}
          <tr>
            <td style={{border: "1px solid #ccc", padding: 4}}>
              <input
                name="key"
                value={serviceEdit.key}
                onChange={handleEditServiceInput}
                style={{ width: 80 }}
                placeholder="key"
              />
            </td>
            <td style={{border: "1px solid #ccc", padding: 4}}>
              <input
                name="label"
                value={serviceEdit.label}
                onChange={handleEditServiceInput}
                style={{ width: 130 }}
                placeholder="Label"
              />
            </td>
            <td style={{border: "1px solid #ccc", padding: 4}}>
              <input
                name="base_price"
                type="number"
                min={0}
                step={0.01}
                value={serviceEdit.base_price}
                onChange={handleEditServiceInput}
                style={{ width: 80 }}
                placeholder="Base Price"
              />
            </td>
            <td style={{border: "1px solid #ccc", padding: 4}}>
              <input
                name="unit"
                value={serviceEdit.unit}
                onChange={handleEditServiceInput}
                style={{ width: 60 }}
                placeholder="Unit"
              />
            </td>
            <td>
              <button type="button" onClick={handleAddService}>Add</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div>
        <button type="submit" disabled={loading}>Update Settings</button>
      </div>
      {success && <div style={{color: "green", marginTop: 8}}>{success}</div>}
    </form>
  );
}

export default BusinessSettings;