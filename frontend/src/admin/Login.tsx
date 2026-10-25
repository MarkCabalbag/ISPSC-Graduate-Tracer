/**
 * Admin login page.
 *
 * @remarks
 * Asks for the admin username and password, signs in through `useAuth().login`
 * and then opens the page the admin first asked for (or `ADMIN_HOME_PATH`). The
 * server's message is shown on failure, for example a wrong password or "Too
 * many login attempts" after five failures in 15 minutes.
 *
 * Uses the same shadcn `Card`, `Input` and `Button` components as the rest of
 * the admin side. Put this file at `src/admin/pages/LoginPage.tsx`; the imports
 * below assume `src/components/ui/` and `src/admin/auth/`.
 */

import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ApiError } from "../api/http"
import { ADMIN_HOME_PATH, useAuth } from "./auth/auth-context";

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The page the admin wanted before being sent here (set by RequireAdmin).
  const from =
    (location.state as { from?: Location } | null)?.from?.pathname ??
    ADMIN_HOME_PATH;

  // Wait for the server to say whether the admin is already signed in.
  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (username.trim() === "" || password === "") {
      setError("Please enter your username and password");
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Cannot reach the server. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm rounded-md">
        <form onSubmit={handleSubmit} noValidate>
          <CardHeader>
            <CardTitle>Admin sign in</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
          </CardContent>

          <CardFooter className="mt-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}