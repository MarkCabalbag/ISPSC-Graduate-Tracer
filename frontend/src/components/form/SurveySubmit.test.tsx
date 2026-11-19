import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFormStore } from "../../context/store";

const addResponse = vi.hoisted(() => vi.fn());

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../../context/hooks", () => ({
  hooks: {
    useGetCollegeDepartment: () => ({ data: [], isLoading: false }),
    useGetRelatedProgram: () => ({
      mutateAsync: vi.fn(),
      data: [],
      isPending: false,
    }),
    useGetRelatedMajor: () => ({
      mutateAsync: vi.fn(),
      data: [],
      isPending: false,
    }),
    useAddResponse: () => ({
      mutateAsync: addResponse,
      isPending: false,
      isError: false,
    }),
  },
}));

const { default: GraduateEmploymentInformation } = await import(
  "./GraduateEmploymentInformation"
);

describe("survey submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFormStore.getState().resetFormState();
  });

  it("lists the missing answers and does not call the API", async () => {
    render(<GraduateEmploymentInformation />);

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(toast.error).toHaveBeenCalledTimes(1);
    const message = vi.mocked(toast.error).mock.calls[0][0] as string;
    expect(message).toMatch(/email/);
    expect(message).toMatch(/full name/);
    expect(message).toMatch(/department/);
    expect(addResponse).not.toHaveBeenCalled();
  });

  it("has uniquely identified, labelled radio groups", () => {
    const { container } = render(<GraduateEmploymentInformation />);

    const ids = [...container.querySelectorAll("[id]")].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(screen.getAllByRole("radiogroup").length).toBeGreaterThan(0);
  });
});
