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

  //the questions
  isEmployed: string;
  isJobAligned: string;
  isSelfEmployed: string;
  isFurtherStudies: string;
  typeOfOrganization: string;
  currentJobLocated: string;

  isProgramOpen: boolean;
  isMajorOpen: boolean;

  handleDepartmentChange: (
    value: string,
    getDepartment: () => Promise<void>
  ) => Promise<void>;

  handleMajorChange: (
    value: string,
    getMajor: () => Promise<void>
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
};

export const useFormStore = create<FormState>((set) => ({
  yearOfSurvey: "",
  email: "",
  fullName: "",
  yearOfGraduation: "",
  departmentId: 0,
  programId: 0,
  majorId: 0,
  isProgramOpen: false,
  isMajorOpen: false,

  isJobAligned: "",
  isSelfEmployed: "",
  isFurtherStudies: "",
  typeOfOrganization: "",
  currentJobLocated: "",
  isContinueFillOut: false,

  //the questions
  isEmployed: "",

  handleDepartmentChange: async (value, getDepartment) => {
    const id = Number(value);
    set({ departmentId: id, isProgramOpen: true });
    await getDepartment();
  },

  handleMajorChange: async (value, getMajor) => {
    const id = Number(value);
    set({ programId: id, isMajorOpen: true });
    await getMajor();
  },

  handleMajorSelect: (value: string) => set({ majorId: Number(value) }),

  handleEmployedChange: (value: string) => {
    value === "yes" ? set({ isEmployed: "yes" }) : set({ isEmployed: "no" });
  },

  handleAlignedJob: (value: string) => set({ isJobAligned: value }),
  handleSelfEmployed: (value: string) => set({ isSelfEmployed: value }),
  handleFurtherStudies: (value: string) => set({ isFurtherStudies: value }),
  handleTypeOfOrganization: (value: string) =>
    set({ typeOfOrganization: value }),
  handleCurrentJobLocation: (value: string) =>
    set({ currentJobLocated: value }),

  handleEmailChange: (value: string) => set({ email: value }),
  handleNameChange: (value: string) => set({ fullName: value }),
  handleGraduationChange: (value: string) => set({ yearOfGraduation: value }),
  handleSurveyChange: (value: string) => set({ yearOfSurvey: value }),
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
  // setColumnFilters: (columnFilters: ColumnFiltersState[]) => void;
  setTable: (table: TableOptions<T>) => void;
  statuses: T[];
  status: string;
  isActive: boolean;
  // columnFilters: ColumnFiltersState[];
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
  // columnFilters: [] as ColumnFiltersState[],
  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },

  setMajorProgram: (major: string) => set({ major: major }),
  setProgramDepartment: (program: string) => set({ program: program }),
  setCollegeDepartment: (department: string) => set({ department: department }),
  // setColumnFilters: (columnFilters: ColumnFiltersState[]) => {
  //   set({ columnFilters });
  // },
  setPageIndex: (pageSize: number, pageIndex: number) =>
    set({
      pagination: {
        pageIndex: pageIndex,
        pageSize: pageSize,
      },
    }),
  setTable: (table: TableOptions<unknown>) => set({ table }),

  setNewProgram: (program: string) => set({ program: program }),
  setOpenEditProgram: (open: boolean) => set({ openEditProgram: open }),
}));
