import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import StartPage from "./StartPage";

const renderStart = () =>
  render(
    <MemoryRouter>
      <StartPage />
    </MemoryRouter>,
  );

describe("start page", () => {
  it("opens with the survey title and a Start now link to the survey", () => {
    renderStart();
    expect(screen.getByRole("heading", { level: 1, name: "Graduate tracer survey" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start now" })).toHaveAttribute("href", "/survey");
  });

  it("lists the survey's three steps in order", () => {
    renderStart();
    const steps = within(screen.getByRole("list", { name: "You will be asked about" })).getAllByRole("listitem");
    expect(steps.map((li) => li.textContent)).toEqual([
      expect.stringContaining("About you"),
      expect.stringContaining("Your degree"),
      expect.stringContaining("Your work"),
    ]);
  });

  it("describes the photo truthfully and credits it", () => {
    renderStart();
    expect(
      screen.getByRole("img", { name: "Nuestra Señora de la Asunción Church and its bell tower in Santa Maria, Ilocos Sur" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/by Luzviminda7641, CC0/)).toBeInTheDocument();
  });

  it("keeps the privacy notice and staff sign-in links", () => {
    renderStart();
    expect(screen.getByRole("link", { name: "Read the privacy notice" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Sign in to the admin" })).toHaveAttribute("href", "/admin/login");
  });
});
