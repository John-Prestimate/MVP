import React from "react";
import BusinessSettings from "./BusinessSettings";
import EstimateHistory from "./EstimateHistory";

const Dashboard: React.FC = () => {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>
        Welcome! This is where you will see your business settings and estimate history.
      </p>
      <BusinessSettings />
      <EstimateHistory />
    </div>
  );
};

export default Dashboard;