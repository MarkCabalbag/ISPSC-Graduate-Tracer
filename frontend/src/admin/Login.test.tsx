import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/http";
import { AuthContext, type AuthContextValue } from "./auth/auth-context";
import LoginPage from "./Login";

const renderLogin = (login: AuthContextValue["login"]) => {
  const value: AuthContextValue = {
    isAuthenticated: false,
    isLoading: false,
    login,
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
};

describe("Admin login page", () => {
  it("has labelled fields and asks for both values before calling the API", async () => {
    const login = vi.fn();
    renderLogin(login);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /enter your username and password/i,
    );
    expect(login).not.toHaveBeenCalled();
  });

  it("sends the trimmed username and the password", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderLogin(login);

    await userEvent.type(screen.getByLabelText(/username/i), "  admin ");
    await userEvent.type(screen.getByLabelText(/password/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("admin", "secret"));
  });

  it("shows the server's message when sign-in fails", async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new ApiError(401, "Invalid username or password"));
    renderLogin(login);

    await userEvent.type(screen.getByLabelText(/username/i), "admin");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid username or password",
    );
  });
});
