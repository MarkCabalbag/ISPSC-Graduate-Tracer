import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

const AdminLogin = lazy(() => import("./admin/Login.tsx"));
const OverviewRowGraduates = lazy(() => import("./components/OverviewRowGraduates.tsx"));

import Home from "./components/Home.tsx";
const Form = lazy(() => import("./Form.tsx"));
import AuthProvider from "./admin/auth/AuthProvider.tsx";
import RequireAdmin from "./admin/auth/RequireAdmin.tsx";
const Dashboard = lazy(() => import("./admin/Dashboard.tsx"));

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} />
      <Route path="/form" element={<Form />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route
          path="/graduates/:year/:program"
          element={<OverviewRowGraduates />}
        />
      </Route>
    </>
  )
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense
          fallback={
            <div role="status" className="p-8 text-center text-neutral-600">
              Loading...
            </div>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);