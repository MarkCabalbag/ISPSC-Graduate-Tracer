import { StrictMode } from "react";
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

import AdminLogin from "./admin/Login.tsx";
import OverviewRowGraduates from "./components/OverviewRowGraduates.tsx";

import Home from "./components/Home.tsx";
import Form from "./Form.tsx";
import AuthProvider from "./admin/auth/AuthProvider.tsx";
import RequireAdmin from "./admin/auth/RequireAdmin.tsx";
import Dashboard from "./admin/Dashboard.tsx";

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
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);