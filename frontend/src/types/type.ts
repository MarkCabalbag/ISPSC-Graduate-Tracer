
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


export type collegeDepartment = {
  id?: number;
  program?: string;
  department?: string;
};

export type OverviewTracedGraduates = {
  id: string;
  department: string;
  totalTracedGraduates: number;
};

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