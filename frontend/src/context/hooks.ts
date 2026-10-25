import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from '../api/client';
import { Response } from "../types/type";
import toast from "react-hot-toast";
// const useGetCollegeDepartment = () => {
//   return useQuery({
//     queryKey: ["department"],
//     queryFn: () => client.getDepartment(),
//   });
// };

const useGetRelatedProgram = (id: number) => {
  return useMutation({
    mutationFn: () => client.getRelatedProgram(id),
    onSuccess: () => {},
  });
};

const useGetRelatedMajor = (id: number) => {
  return useMutation({
    mutationFn: () => client.getRelatedMajor(id),
  });
};

const useAddResponse = (onSuccess?: () => void) => {
  return useMutation({
    mutationFn: (response: Response) => client.addResponse(response),
    onSuccess: (data) => {
      toast.success(data.message);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error?.message);
    },
  });
};

/**
 * React Query hooks of the admin side.
 *
 * @remarks
 * Every hook calls the new `client` (`client.admin.*` for admin data and
 * changes, `client.getDepartment` and `client.listProgram` for the public
 * lists), so every request carries the admin session cookie and the CSRF
 * header, times out cleanly and reports the server's own error message.
 *
 * Replace the content of your existing hooks file with this one. Keep the
 * `client` import line your file already has if its path differs.
 *
 * Query keys and the `invalidateQueries` calls are unchanged from the old file.
 * The data returned by the hooks is now typed (see `types/api.ts`), so a
 * component that reads a field that does not exist will show an error.
 */



/* -------------------------------------------------------------------------- */
/*                          Departments, programs, majors                     */
/* -------------------------------------------------------------------------- */

export const useCreateCollege = (department: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.addDepartment(department),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["departmentDetails"] });
      queryClient.invalidateQueries({ queryKey: ["overviewTracedGraduates"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const useGetCollegeDepartment = () => {
  return useQuery({
    queryKey: ["collegeDepartment"],
    queryFn: () => client.getDepartment(),
  });
};

export const useGetPrograms = () => {
  return useQuery({
    queryKey: ["programs"],
    queryFn: () => client.listProgram(),
  });
};

export const useCreateProgram = (program: string, departmentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.addProgram(departmentId, program),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["departmentDetails"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const useCreateMajor = (major: string, programId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.addMajor(programId, major),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["departmentDetails"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const useGetDepartmentDetails = () => {
  return useQuery({
    queryKey: ["departmentDetails"],
    queryFn: () => client.admin.getDepartmentDetails(),
  });
};

export const useRemoveProgram = (programId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.removeProgram(programId),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["departmentDetails"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const useEditProgram = (programId: number, program: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.editProgram(programId, program),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["departmentDetails"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const useRemoveMajor = (majorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.removeMajor(majorId),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["departmentDetails"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const useEditMajor = (majorId: number, major: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.editMajor(majorId, major),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["departmentDetails"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const useRemoveDepartment = (departmentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.removeDepartment(departmentId),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["departmentDetails"] });
      queryClient.invalidateQueries({ queryKey: ["overviewTracedGraduates"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                                  Dashboard                                 */
/* -------------------------------------------------------------------------- */

export const useGetSummaryData = () => {
  return useQuery({
    queryKey: ["summaryData"],
    queryFn: () => client.admin.getSummary(),
  });
};

export const useGetOverviewTracedGraduates = () => {
  return useQuery({
    queryKey: ["overviewTracedGraduates"],
    queryFn: () => client.admin.getDepartmentOverview(),
  });
};

export const useGetListPrograms = () => {
  return useQuery({
    queryKey: ["listOfPrograms"],
    queryFn: () => client.admin.listPrograms(),
  });
};

/* -------------------------------------------------------------------------- */
/*                            One year and program                            */
/* -------------------------------------------------------------------------- */

export const useGetGraduatesPerRow = (
  yearOfGraduation: number,
  program: string
) => {
  return useQuery({
    queryKey: ["graduatesPerRow"],
    queryFn: () => client.admin.getGraduates(Number(yearOfGraduation), program),
  });
};

export const useGetTotalGraduates = (
  yearOfGraduation: string,
  program: string
) => {
  return useQuery({
    queryKey: ["totalGraduates"],
    queryFn: () => client.admin.getTotalGraduates(yearOfGraduation, program),
  });
};

export const useAddTotalGraduates = (id: number, totalGraduates: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.setTotalGraduates(id, totalGraduates),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["totalGraduates"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const useGetEmploymentStatistics = (
  yearOfGraduation: string,
  program: string
) => {
  return useQuery({
    queryKey: ["employmentStatistics"],
    queryFn: () =>
      client.admin.getEmploymentStatistics(yearOfGraduation, program),
  });
};

export const useGetQuestions = (yearOfGraduation: string, program: string) => {
  return useQuery({
    queryKey: ["questions"],
    queryFn: () => client.admin.getQuestions(yearOfGraduation, program),
  });
};

export const useGetPercentageTraced = (
  yearOfGraduation: string,
  program: string
) => {
  return useQuery({
    queryKey: ["tracedPercentage"],
    queryFn: () => client.admin.getTracedPercentage(yearOfGraduation, program),
  });
};

export const useGetOrganization = (
  yearOfGraduation: string,
  program: string
) => {
  return useQuery({
    queryKey: ["organization"],
    queryFn: () => client.admin.getOrganizations(yearOfGraduation, program),
  });
};

export const useGetCurrentJobLocation = (
  yearOfGraduation: string,
  program: string,
) => {
  return useQuery({
    queryKey: ["jobLocation"],
    queryFn: () => client.admin.getJobLocations(yearOfGraduation, program),
  });
};

export const useDeleteStudentRecord = (studentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.admin.deleteResponse(studentId),
    onSuccess: (data) => {
      toast.success(data?.message as string);
      queryClient.invalidateQueries({ queryKey: ["graduatesPerRow"] });
    },
    onError: (error) => {
      toast.error(error?.message as string);
    },
  });
};

export const hooks = {
  useGetCollegeDepartment,
  useGetRelatedProgram,
  useGetRelatedMajor,
  useAddResponse,
};
