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

import ProtectedRoute from "./admin/auth/ProtectedRoute.tsx";
import AdminLogin from "./admin/Login.tsx";
import OverviewRowGraduates from "./components/OverviewRowGraduates.tsx";

import Home from "./components/Home.tsx";
import Form from "./Form.tsx";
import AuthProvider from "./admin/auth/AuthProvider.tsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} />
      <Route path="/form" element={<Form />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute />} />
      <Route
        path="/graduates/:year/:program"
        element={<OverviewRowGraduates />}
      />
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