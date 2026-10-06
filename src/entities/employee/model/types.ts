import type { CompanyRole, UserRole } from "@/shared/api/types/UserType";

/**
 * admin_employees RPC의 한 사람 중 프로필 부분 (인사담당자 전용).
 * 응답에는 attendance_range와 같은 근태 필드(policy, records)도 붙어 오는데, entities끼리는 참조하지 않으므로
 * 쓰는 쪽에서 Employee<근태 타입>으로 합친다.
 */
export interface EmployeeProfile {
  userId: number;
  nickname: string;
  email: string;
  image: string | null;
  companyRole: CompanyRole;
  isActive: boolean;
  /** 입사일 "YYYY-MM-DD" */
  hiredOn: string;
  /** 직접 배정한 정책. null이면 기본 정책 */
  policyId: number | null;
  memberships: { groupId: number; groupName: string; role: UserRole }[];
}

export type Employee<TAttendance = object> = EmployeeProfile & TAttendance;

export interface AdminEmployees<TAttendance = object> {
  today: string;
  employees: Employee<TAttendance>[];
}

/** admin_policies RPC 항목 = policy_json + 인원. TPolicy는 근태 엔티티의 PolicyInfo */
export type AdminPolicy<TPolicy = { id: number; name: string; isDefault: boolean }> = TPolicy & {
  /** 적용 인원 (재직자, 정책 없는 사람은 기본 정책으로) */
  employeeCount: number;
  /** 직접 배정된 사람 수 (퇴사자 포함). 0이고 기본 정책이 아니어야 지울 수 있다 */
  assignedCount: number;
};
