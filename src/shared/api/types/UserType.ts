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

export interface User {
  /** 사용자가 고른 접속 상태. Supabase 모드에서만 온다 */
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
