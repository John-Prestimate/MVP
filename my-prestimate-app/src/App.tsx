import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ShowUserId } from "./ShowUserId";
import MapView from "./components/MapView";
import SignUp from "./components/SignUp";

import EmbedInstructions from "./components/EmbedInstructions";

function App() {
  return (
    <MantineProvider>
      <Router>
        <ShowUserId />
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/Mapview" element={<MapView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/embed-instructions" element={<EmbedInstructions />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
}

export default App;