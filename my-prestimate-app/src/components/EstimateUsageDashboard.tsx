import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface EstimateUsageDashboardProps {
  userId: string;
}

const EstimateUsageDashboard: React.FC<EstimateUsageDashboardProps> = ({ userId }) => {
  const [usage, setUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      setLoading(true);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);
      const { count } = await supabase
        .from('estimates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());
      setUsage(typeof count === 'number' ? count : 0);
      setLoading(false);
    }
    if (userId) fetchUsage();
  }, [userId]);

  if (loading) return <div>Loading estimate usage...</div>;
  return (
    <div style={{ padding: 24, background: '#f8fafc', borderRadius: 8, border: '1px solid #e0e7ef', maxWidth: 400 }}>
      <h2 style={{ marginBottom: 12 }}>Estimate Usage This Month</h2>
      <div style={{ fontSize: 18, fontWeight: 600, color: usage >= 100 ? 'red' : '#222' }}>
        {usage} / 100 estimates used
      </div>
      {usage >= 100 && (
        <div style={{ color: 'red', marginTop: 8 }}>
          Limit reached. Upgrade to Pro for unlimited estimates.
        </div>
      )}
    </div>
  );
};

export default EstimateUsageDashboard;
