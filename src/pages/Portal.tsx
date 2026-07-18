import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const Portal = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    switch (userRole) {
      case "owner":
      case "admin":
        navigate("/admin/dashboard", { replace: true });
        break;
      case "childminder":
        navigate("/childminder", { replace: true });
        break;
      case "parent":
        navigate("/parent", { replace: true });
        break;
      case "employer":
        navigate("/employer", { replace: true });
        break;
      default:
        navigate("/auth", { replace: true });
    }
  }, [loading, user, userRole, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  );
};

export default Portal;
