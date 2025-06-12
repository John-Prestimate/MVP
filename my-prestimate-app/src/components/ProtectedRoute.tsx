import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../supabase/useSession";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[ProtectedRoute] session:", session, "loading:", loading);
    if (!loading && !session) {
      console.log("[ProtectedRoute] Redirecting to /login");
      navigate("/login", { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    console.log("[ProtectedRoute] Loading...");
    return <div>Loading...</div>;
  }

  console.log("[ProtectedRoute] Rendering children:", !!session);
  return <>{children}</>;
}