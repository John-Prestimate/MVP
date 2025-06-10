import React, { useEffect, useState } from 'react';
import { getBusinessSettings, updateBusinessSettings } from '../api/businessSettings';

function BusinessSettings() {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getBusinessSettings()
      .then(data => {
        setForm(data || {});
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateBusinessSettings(form);
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
      {/* Add more fields as needed */}
      <button type="submit" disabled={loading}>Update Settings</button>
      {success && <div style={{color: "green"}}>{success}</div>}
    </form>
  );
}

export default BusinessSettings;