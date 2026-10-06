import { Group } from "@/shared/api/types/UserType";
import { GroupMember, TaskList } from "@/shared/api/types/GroupData";

export interface GetGroupsRequest {
  id: number;
}

export interface GetGroupsResponse {
  createdAt: string;
  id: number;
  image: string;
  members: GroupMember[];
  name: string;
  taskLists: TaskList[];
  teamId: string;
  updatedAt: string;
}

export interface DeleteGroupRequest {
  id: number;
}

export interface DeleteGroupResponse {
  message?: string;
}

export interface PatchGroupRequest {
  param: {
    id: number;
  };
  body: {
    image?: string | null;
    name?: string;
  };
}

export type PatchGroupResponse = Group;

export interface DeleteMemberRequest {
  id: number;
  memberUserId: number;
}

/** 사이드바 팀 목록 등 이름만 필요한 곳 */
export interface TeamSummary {
  id: number;
  name: string;
}
