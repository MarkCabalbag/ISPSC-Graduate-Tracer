/**
 * =============================================================================
 * Navigation.tsx: sticky top bar shared by the public and admin pages
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Shows the brand, the main links, and the primary actions. It has no props
 * and makes no API calls.
 *
 * LAYOUT (left to right)
 * ----------------------
 *   1. Brand       ISPSC logo + "Graduate Tracer"; links to "/".
 *   2. Links       Home ("/") and Tracer Survey ("/form"). The current page is
 *                  highlighted and marked with aria-current="page".
 *                  Hidden below the `md` breakpoint.
 *   3. Actions     - "Logout": only when the admin is logged in AND the
 *                    current path starts with "/admin".
 *                  - "Take Survey": on every page except "/form".
 *
 * LOGOUT
 * ------
 *   Removes the "ispsc_admin_auth" flag from localStorage and goes to
 *   "/admin/login".
 *   NOTE: this flag only decides what the UI shows. It is not security. Anyone
 *   can set it in the browser. Real protection of admin pages and data must be
 *   done by the server (session / token checks).
 *
 * HOW TO ADD A LINK
 * -----------------
 *   Add one entry to NAV_LINKS ({ to, label, icon }).
 *
 * REQUIREMENTS
 * ------------
 *   - Must be rendered inside a react-router <Router>.
 *   - ../assets/ispsc.png, Tailwind theme color `primary`.
 *
 * DEPENDENCIES
 * ------------
 *   react-router-dom, lucide-react, ./ui/button
 *
 * @example
 * <Navigation />
 *
 * @returns A sticky `<header>` containing the brand link, a `<nav>` with the
 * main links, and the action buttons described above.
 * =============================================================================
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Home as HomeIcon,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import logo from "../assets/ispsc.png";
import { Button } from "./ui/button";

const ADMIN_AUTH_KEY = "ispsc_admin_auth";
const SURVEY_PATH = "/form";
const ADMIN_LOGIN_PATH = "/admin/login";

type NavItem = { to: string; label: string; icon: LucideIcon };

/** Links shown in the middle of the bar. */
const NAV_LINKS: NavItem[] = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: SURVEY_PATH, label: "Tracer Survey", icon: GraduationCap },
];

/**
 * Reads the admin flag. localStorage can throw (private mode, blocked
 * storage), and that must not break the whole page.
 */
const isAdminLoggedIn = (): boolean => {
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === "true";
  } catch {
    return false;
  }
};

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminAuth = isAdminLoggedIn();

  const handleLogout = () => {
    try {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    } catch {
      // Storage is not available, so there is nothing to clear.
    }
    navigate(ADMIN_LOGIN_PATH);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src={logo}
            alt="ISPSC Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <span className="font-bold text-base md:text-lg text-primary tracking-tight block leading-none">
              ISPSC
            </span>
            <span className="text-xs text-neutral-500 font-medium tracking-wide">
              Graduate Tracer
            </span>
          </div>
        </Link>

        {/* Zone 2: Navigation Links */}
        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600"
        >
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isActive ? "text-primary font-semibold" : "hover:text-primary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdminAuth && location.pathname.startsWith("/admin") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          )}

          {location.pathname !== SURVEY_PATH && (
            <Link to={SURVEY_PATH}>
              <Button
                size="sm"
                className="bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
              >
                Take Survey
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;