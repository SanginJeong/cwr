import { useQuery } from "@tanstack/react-query";
import { getAdminEmployees, getAdminPolicies } from "./employee.supabase";

/** 구성원·정책을 바꾼 뒤에는 employeeKeys.all을 무효화한다 */
export const employeeKeys = {
  all: ["admin"] as const,
  employees: (params: { from: string; to: string }) => [...employeeKeys.all, "employees", params] as const,
  policies: () => [...employeeKeys.all, "policies"] as const,
};

export const useAdminEmployees = <TAttendance = object>(params: { from: string; to: string }) =>
  useQuery({
    queryKey: employeeKeys.employees(params),
    queryFn: () => getAdminEmployees<TAttendance>(params),
    staleTime: 1000 * 30,
  });

export const useAdminPolicies = <TPolicy = object>() =>
  useQuery({ queryKey: employeeKeys.policies(), queryFn: () => getAdminPolicies<TPolicy>(), staleTime: 1000 * 30 });
