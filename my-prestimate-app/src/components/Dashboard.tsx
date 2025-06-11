import React from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome to Prestimate!</h1>
      {/* Add your dashboard content here */}
      <div style={{ margin: "18px 0" }}>
        <Link to="/profile" style={{ color: "#0b80ff", textDecoration: "underline", fontSize: 18 }}>
          My Profile
        </Link>
      </div>
      <button
        onClick={handleLogout}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "#0b80ff",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;