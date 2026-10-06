import type { PresenceStatus } from "@/shared/config/presence";

/**
 * @author jikwon
 * @description 유저와 관련된 타입 정의입니다.
 */

export interface Group {
  teamId: string;
  updatedAt: string;
  createdAt: string;
  image: string;
  name: string;
  id: number;
}

export interface Membership {
  group: Group;
  role: string;
  userImage: string;
  userEmail: string;
  userName: string;
  groupId: number;
  userId: number;
}

/** 회사 역할 (ADR-006). 팀장은 회사 역할이 아니라 팀마다의 memberships.role = "ADMIN" */
export type CompanyRole = "HR_ADMIN" | "EMPLOYEE";

export interface User {
  companyRole: CompanyRole;
  /** 사용자가 고른 접속 상태 */
  presenceStatus?: PresenceStatus;
  teamId: string;
  image: string;
  nickname: string;
  updatedAt: string;
  createdAt: string;
  email: string;
  id: number;
  memberships: Membership[];
}

export type UserRole = "ADMIN" | "MEMBER";

export type UserResponse = User;

export interface TaskUser {
  id: number;
  nickname: string;
  image: string;
}
