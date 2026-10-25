import { Navigate } from "react-router-dom";
import Dashboard from "../Dashboard";

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem("ispsc_admin_auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Dashboard />;
};

export default ProtectedRoute;
