import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const addResponse = vi.hoisted(() => vi.fn());

vi.mock("../api/client", () => ({
  client: {
    getDepartment: vi.fn().mockResolvedValue([{ id: 1, department: "COLLEGE OF COMPUTING STUDIES" }]),
    getRelatedProgram: vi.fn().mockResolvedValue([{ id: 7, program: "BSIT", departmentId: 1 }]),
    getRelatedMajor: vi.fn().mockResolvedValue([]),
    addResponse,
  },
}));

const { default: Survey } = await import("./Survey");

const renderAt = (step?: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[step ? `/survey?step=${step}` : "/survey"]}>
        <Survey />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("graduate survey", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("opens on the privacy notice and requires consent before any question", async () => {
    renderAt();

    expect(screen.getByRole("heading", { level: 1, name: "Before you start" })).toBeInTheDocument();
    expect(screen.getByText(/RA 10173/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Agree and continue" }));

    const summary = await screen.findByRole("alert");
    expect(summary).toHaveTextContent("Select that you agree to the privacy notice to continue");
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("explains each missing or wrong answer next to its field", async () => {
    sessionStorage.setItem("ispsc-tracer-survey", JSON.stringify({ consent: true }));
    renderAt("about");

    await userEvent.type(screen.getByLabelText("Email address", { exact: false }), "juan@ispsc");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    const summary = await screen.findByRole("alert");
    expect(summary).toHaveTextContent("Enter your full name");
    expect(summary).toHaveTextContent("Enter an email address in the correct format, like name@example.com");
    expect(summary).toHaveTextContent("Select the year you graduated");
    expect(screen.getByLabelText("Full name")).toHaveAttribute("aria-invalid", "true");
  });

  it("sends a non-employed graduate's job questions as not applicable", async () => {
    sessionStorage.setItem(
      "ispsc-tracer-survey",
      JSON.stringify({
        consent: true,
        fullName: "Juan Dela Cruz",
        email: "juan@example.com",
        yearOfGraduation: "2024",
        departmentId: "1",
        programId: "7",
        isEmployed: "no",
        isSelfEmployed: "no",
        isFurtherStudies: "yes",
      }),
    );
    addResponse.mockResolvedValue({ message: "ok" });
    renderAt("check");

    await userEvent.click(await screen.findByRole("button", { name: "Submit the survey" }));

    expect(addResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        isEmployed: "no",
        isJobAligned: "not applicable",
        typeOfOrganization: "not applicable",
        currentJobLocated: "not applicable",
        isFurtherStudies: "yes",
        majorId: undefined,
      }),
    );
  });
});
