import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setEmail(null);
      } else {
        setEmail(user?.email ?? null);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div style={{ maxWidth: 350, margin: "60px auto", padding: 24, border: "1px solid #e0e7ef", borderRadius: 8, background: "#fff" }}>
      <h2>Your Profile</h2>
      <div style={{ marginBottom: 12 }}>
        <strong>Email:</strong> {email}
      </div>
      <button
        onClick={handleLogout}
        style={{ padding: 10, fontSize: 16, background: "#f44336", color: "#fff", border: "none", borderRadius: 4, width: "100%" }}
      >
        Log Out
      </button>
    </div>
  );
};

export default Profile;