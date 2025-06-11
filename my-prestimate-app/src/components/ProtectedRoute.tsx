import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../supabase/useSession"; // Adjust this import to your actual Supabase session hook

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}