import Dashboard from "./components/Dashboard";
import React from 'react';
import MapView from "./components/MapView"; // ✅ CORRECT

function App() {
  return (
    <div>
      <h1>Welcome to Prestimate</h1>
      <Dashboard />
      <MapView />
    </div>
  );
}

export default App;