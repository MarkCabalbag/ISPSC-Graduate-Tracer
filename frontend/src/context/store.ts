
import { create } from "zustand";
import { TableOptions } from "@tanstack/react-table";

type FormState = {
  email: string;
  yearOfSurvey: string;
  fullName: string;
  yearOfGraduation: string;
  departmentId: number;
  programId: number;
  majorId: number;

  // Employment questions
  isEmployed: string;
  isJobAligned: string;
  isSelfEmployed: string;
  isFurtherStudies: string;
  typeOfOrganization: string;
  currentJobLocated: string;

  isProgramOpen: boolean;
  isMajorOpen: boolean;
  isContinueFillOut: boolean;

  handleDepartmentChange: (
    value: string,
    getDepartment: () => Promise<unknown>
  ) => Promise<void>;

  handleMajorChange: (
    value: string,
    getMajor: () => Promise<unknown>
  ) => Promise<void>;

  handleMajorSelect: (value: string) => void;
  handleEmployedChange: (value: string) => void;
  handleEmailChange: (value: string) => void;
  handleNameChange: (value: string) => void;
  handleGraduationChange: (value: string) => void;
  handleSurveyChange: (value: string) => void;
  handleAlignedJob: (value: string) => void;
  handleSelfEmployed: (value: string) => void;
  handleFurtherStudies: (value: string) => void;
  handleTypeOfOrganization: (value: string) => void;
  handleCurrentJobLocation: (value: string) => void;

  resetFormState: () => void;
};

const initialFormState = {
  yearOfSurvey: "",
  email: "",
  fullName: "",
  yearOfGraduation: "",
  departmentId: 0,
  programId: 0,
  majorId: 0,

  isProgramOpen: false,
  isMajorOpen: false,
  isContinueFillOut: false,

  isEmployed: "",
  isJobAligned: "",
  isSelfEmployed: "",
  isFurtherStudies: "",
  typeOfOrganization: "",
  currentJobLocated: "",
};

export const useFormStore = create<FormState>((set) => ({
  ...initialFormState,

  handleDepartmentChange: async (value, getDepartment) => {
    const id = value ? Number(value) : 0;

    // Reset dependent selections when the department changes.
    set({
      departmentId: id,
      programId: 0,
      majorId: 0,
      isProgramOpen: Boolean(id),
      isMajorOpen: false,
    });

    if (id) {
      await getDepartment();
    }
  },

  handleMajorChange: async (value, getMajor) => {
    const id = value ? Number(value) : 0;

    // Reset the selected major when the program changes.
    set({
      programId: id,
      majorId: 0,
      isMajorOpen: Boolean(id),
    });

    if (id) {
      await getMajor();
    }
  },

  handleMajorSelect: (value) =>
    set({ majorId: value ? Number(value) : 0 }),

  handleEmployedChange: (value) =>
    set({
      isEmployed: value === "yes" ? "yes" : value === "no" ? "no" : "",
    }),

  handleAlignedJob: (value) => set({ isJobAligned: value }),
  handleSelfEmployed: (value) => set({ isSelfEmployed: value }),
  handleFurtherStudies: (value) => set({ isFurtherStudies: value }),
  handleTypeOfOrganization: (value) =>
    set({ typeOfOrganization: value }),
  handleCurrentJobLocation: (value) =>
    set({ currentJobLocated: value }),

  handleEmailChange: (value) => set({ email: value }),
  handleNameChange: (value) => set({ fullName: value }),
  handleGraduationChange: (value) =>
    set({ yearOfGraduation: value }),
  handleSurveyChange: (value) => set({ yearOfSurvey: value }),

  resetFormState: () => set({ ...initialFormState }),
}));

type AdminState<T> = {
  department: string;
  departmentId: number;
  program: string;
  major: string;
  programId: number;

  setCollegeDepartment: (department: string) => void;
  setProgramDepartment: (program: string) => void;
  setMajorProgram: (major: string) => void;
  setNewProgram: (program: string) => void;

  openEditProgram: boolean;
  setOpenEditProgram: (open: boolean) => void;

  table: TableOptions<T>;
  setTable: (table: TableOptions<T>) => void;

  statuses: T[];
  status: string;
  isActive: boolean;

  pagination: {
    pageIndex: number;
    pageSize: number;
  };

  setPageIndex: (pageIndex: number, pageSize: number) => void;
};

export const useAdminStore = create<AdminState<unknown>>((set) => ({
  department: "",
  departmentId: 0,
  program: "",
  major: "",
  programId: 0,

  openEditProgram: false,
  table: {} as TableOptions<unknown>,
  statuses: [],
  status: "",
  isActive: false,

  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },

  setMajorProgram: (major) => set({ major }),
  setProgramDepartment: (program) => set({ program }),
  setCollegeDepartment: (department) => set({ department }),

  setPageIndex: (pageIndex, pageSize) =>
    set({
      pagination: { pageIndex, pageSize },
    }),

  setTable: (table) => set({ table }),
  setNewProgram: (program) => set({ program }),
  setOpenEditProgram: (open) => set({ openEditProgram: open }),
}));
