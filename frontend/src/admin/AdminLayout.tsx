import { Suspense, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import seal from "../assets/seal-96.webp";
import { useAuth, ADMIN_LOGIN_PATH } from "./auth/auth-context";
import { Button, Chip, Skeleton, cx } from "../components/kit";

const NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/respondents", label: "Respondents", end: false },
  { to: "/admin/programs", label: "Programs and colleges", end: false },
];

const isPreview = import.meta.env.VITE_MOCK_API === "true";

/** The MIS office's shell: one top bar with the navigation, then the page on the gray band. */
export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const page = NAV.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))?.label ?? "Admin";
    document.title = `${page} – ISPSC Graduate Tracer admin`;
  }, [pathname]);

  const signOut = async () => {
    await logout();
    navigate(ADMIN_LOGIN_PATH, { replace: true });
  };

  return (
    <div className="min-h-svh bg-band">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-gold px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-[min(100%-32px,1312px)] flex-wrap items-center gap-x-10 gap-y-1">
          <NavLink to="/admin" className="flex h-16 items-center gap-3 text-[17px] font-bold text-ink no-underline">
            <img src={seal} alt="" width={32} height={32} className="size-8 rounded-full" />
            ISPSC Tracer
          </NavLink>
          <nav aria-label="Admin" className="order-3 -mx-4 flex w-[calc(100%+32px)] overflow-x-auto px-4 [scrollbar-width:none] md:order-none md:mx-0 md:w-auto md:overflow-visible md:px-0">
            <ul className="flex gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cx(
                        "-mb-px flex h-12 items-center border-b-2 px-3 text-[15px] font-semibold whitespace-nowrap no-underline transition-colors md:h-16",
                        isActive
                          ? "border-brand text-ink"
                          : "border-transparent text-muted-foreground hover:border-line-strong hover:text-ink",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {isPreview && <Chip>Sample data</Chip>}
            <span className="hidden items-center gap-2 text-[15px] font-medium text-ink-2 sm:flex">
              <span aria-hidden="true" className="grid size-7 place-items-center rounded-md border border-line bg-band text-[11px] font-bold text-muted-foreground">
                MIS
              </span>
              MIS office
            </span>
            <Button size="sm" variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-[min(100%-32px,1312px)] pb-16 outline-none">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export const PageSkeleton = () => (
  <div className="grid gap-6 pt-6" aria-busy="true" aria-label="Loading">
    <Skeleton className="h-9 w-56" />
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
    <Skeleton className="h-72" />
  </div>
);
