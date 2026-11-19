import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useParams,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";

import StartPage from "./site/StartPage";
import AuthProvider from "./admin/auth/AuthProvider";
import RequireAdmin from "./admin/auth/RequireAdmin";

// The public start page loads with the first bundle; everything else on demand.
const Survey = lazy(() => import("./site/Survey"));
const PrivacyNotice = lazy(() => import("./site/PrivacyNotice"));
const AdminLogin = lazy(() => import("./admin/Login"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const Overview = lazy(() => import("./admin/Overview"));
const Respondents = lazy(() => import("./admin/Respondents"));
const Programs = lazy(() => import("./admin/Programs"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

/** The old cohort page URL now opens the same cohort in Respondents. */
const LegacyCohortRedirect = () => {
  const { year = "", program = "" } = useParams();
  return <Navigate to={`/admin/respondents?year=${encodeURIComponent(year)}&program=${encodeURIComponent(program)}`} replace />;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<StartPage />} />
      <Route path="/survey" element={<Survey />} />
      <Route path="/form" element={<Navigate to="/survey" replace />} />
      <Route path="/privacy" element={<PrivacyNotice />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="respondents" element={<Respondents />} />
          <Route path="programs" element={<Programs />} />
        </Route>
        <Route path="/graduates/:year/:program" element={<LegacyCohortRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </>,
  ),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense
          fallback={
            <p role="status" className="p-8 text-muted-foreground">
              Loading
            </p>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: { background: "#111827", color: "#fff", fontSize: "15px", borderRadius: "8px", padding: "10px 14px" },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
