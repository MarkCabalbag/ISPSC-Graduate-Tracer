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
    username: null,
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
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    const summary = screen.getByRole("alert");
    expect(summary).toHaveTextContent(/enter your username/i);
    expect(summary).toHaveTextContent(/enter your password/i);
    expect(login).not.toHaveBeenCalled();
  });

  it("sends the trimmed username and the password", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderLogin(login);

    await userEvent.type(screen.getByLabelText(/username/i), "  admin ");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("admin", "secret"));
  });

  it("shows and hides the password from the button inside the field", async () => {
    renderLogin(vi.fn());
    const input = screen.getByLabelText("Password");

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("says plainly when the username or password is wrong", async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new ApiError(401, "Invalid username or password"));
    renderLogin(login);

    await userEvent.type(screen.getByLabelText(/username/i), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The username or password is not correct",
    );
  });
});
