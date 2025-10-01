import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
// [FIX 2] Helper component to preserve query params in redirects
function PreserveQueryNavigate({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}
import { MantineProvider } from "@mantine/core";
import Login from "./components/Login";
// import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ShowUserId } from "./ShowUserId";
import MapView from "./components/MapView";
import SignUp from "./components/SignUp";
import ActivateDashboard from "./dashboard/ActivateDashboard";

import EmbedInstructions from "./components/EmbedInstructions";

function App() {
  return (
    <MantineProvider>
      <Router>
        <ShowUserId />
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/Mapview" element={<MapView />} />
          {/* [FIX 1] Add explicit /embed route for MapView */}
          <Route path="/embed" element={<MapView />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/activate" element={<ActivateDashboard />} />
          <Route path="/embed-instructions" element={<EmbedInstructions />} />
          {/* [FIX 2] Update Navigate to preserve query params */}
          <Route path="*" element={<PreserveQueryNavigate to="/" />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
}

export default App;