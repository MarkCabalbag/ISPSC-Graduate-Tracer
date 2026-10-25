/**
 * Route guard for the admin pages.
 *
 * @remarks
 * Shows the nested routes only when the admin is signed in. While the first
 * check with the server is running it shows a short message, so a signed-in
 * admin is not sent to the login page by mistake on every reload. Otherwise it
 * sends the admin to the login page and remembers the page they wanted, so the
 * login page can bring them back after signing in.
 *
 * This only hides pages in the browser. The real protection is on the server:
 * the admin API routes answer `401` without a valid session.
 *
 * Put this file at `src/admin/auth/RequireAdmin.tsx`.
 *
 * @example
 * ```tsx
 * { path: "/admin/login", element: <LoginPage /> },
 * {
 *   element: <RequireAdmin />,
 *   children: [{ path: "/admin", element: <AdminLayout />, children: [...] }],
 * },
 * ```
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ADMIN_LOGIN_PATH, useAuth } from "./auth-context";

export default function RequireAdmin() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div role="status" className="p-6 text-sm text-gray-600">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ADMIN_LOGIN_PATH} replace state={{ from: location }} />;
  }

  return <Outlet />;
}