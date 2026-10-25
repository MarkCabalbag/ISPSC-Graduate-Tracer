import { ChartConfig } from "../components/ui/chart";
import type { Column, Row, useReactTable } from "@tanstack/react-table";

export type Response = {
  yearOfSurvey?: number;
  email?: string;
  fullName?: string;
  yearOfGraduation?: number;
  departmentId?: number;
  programId?: number;
  majorId?: number;
  isEmployed?: string;
  isJobAligned?: string;
  isSelfEmployed?: string;
  isFurtherStudies?: string;
  typeOfOrganization?: string;
  currentJobLocated?: string;
};

export type EmploymentInformation = {
  id?: number | undefined;
  department?: string;
  program?: string;
  major?: string;
};

export type ChartTypes = {
  chartData: any[];
  chartConfig: ChartConfig;
  dataKey: string;
  nameKey?: string;
  valueKey?: any;
  title: string;
  description: string;
};


export type ModalType = {
  isOpen: boolean;
  handleIsOpen: (value: boolean) => void;
};

export type collegeDepartment = {
  id?: number;
  program?: string;
  department?: string;
};

export interface ColumnFilter {
  id: string;
  value: unknown;
}

export type TableProps<TData> = {
  tableHeader?: React.ReactNode;
  tableBody?: React.ReactNode;
  tableFooter?: React.ReactNode;
  to?: string;
  data?: TData[];
  column?: Column<any, unknown>[] | undefined;
  rowLength?: number;
};

export type FormatData<T, U> = {
  yearData?: T;
  programData?: U;
};

export type OverviewTracedGraduates = {
  id: string;
  department: string;
  totalTracedGraduates: number;
};

export type FilterType<T> = {
  table: typeof useReactTable;
  setColumnFilters: () => void;
  statuses: T[];
  status: string;
  isActive: boolean;
  columnFilters: [];
};

//export type ColumnFiltersState<T> = ColumnFilter<T>[];

export type FilterFn = (
  row: Row<any>,
  columnId: string,
  filterValue: any,
  addMeta: (meta: any) => void
) => boolean;

export type TotalGraduatesType = {
  id?: number;
  program?: string;
  department?: string;
  totalGraduates?: number;
  yearOfGraduation?: number;
};

export type Graduates = {
  major: string;
  totalCount: number;
  totalEmployed: number;
  totalNotEmployed: number;
};

export type PercenatgeType = {
  major: string;
  totalPercentageTraced: number;
  totalPercentageUntraced: number;
  fill: string;
};

export const maroonPalette = [
  "hsl(0, 100%, 25%)", // Maroon
  "hsl(51, 100%, 50%)", // Gold
  "hsl(46, 65%, 53%)", // Metallic Gold
  "hsl(25, 76%, 30%)", // Saddle Brown
  "hsl(0, 0%, 75%)", // Silver
  "hsl(0, 59%, 41%)", // Brown
  "hsl(34, 78%, 91%)", // Antique White
  "hsl(207, 44%, 49%)", // Steel Blue
  "hsl(82, 39%, 30%)", // Dark Olive Green
];

export const chartConfigBar = {
  totalEmployed: {
    label: "Employed",
    color: "hsl(var(--chart-1))",
  },
  totalNotEmployed: {
    label: "Not Employed",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const chartConfigQuestions = {
  yes: { label: "Yes" },
  no: { label: "No" },
} satisfies ChartConfig;

export const chartConfigPie = {
  tracedPercentage: {
    label: "Traced",
    color: "hsl(var(--chart-1))",
  },
  untracedPercentage: {
    label: "Untraced",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const chartConfigBarHorizontal = {
  total: { label: "Total", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export type Major = {
  id?: number;
  major?: string;
};

export interface DepartmentDetails {
  id: number;
  department: string;
  listOfProgram: Program[];
}

export interface Program {
  id: number;
  program: string;
  listOfMajor: Major[];
}

export type GraduateRow = {
  /** Record id. Not a column: the Delete / Update buttons use it. */
  id: number;
  fullName: string;
  email: string;
  yearOfGraduation: number;
  yearOfSurvey: number;
  department: string;
  program: string;
  major: string;
  /** "Are you currently employed?" */
  isEmployed: string;
  /** "Is your job aligned with your program?" */
  isJobAligned: string;
  /** "Are you self-employed?" */
  isSelfEmployed: string;
  /** "Are you currently enrolled in further studies?" */
  isFurtherStudies: string;
  /** "What type of organization do you work for?" */
  typeOfOrganization: string;
  /** "Where is your current job located?" */
  currentJobLocated: string;
};