import type { Group } from "@/shared/api/types/UserType";
import type { GetGroupsResponse } from "@/shared/api/types/groupApi";

interface GroupRow {
  id: number;
  name: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

/** groups 테이블 행 → 기존 Group 타입 */
export const mapGroupRow = (row: GroupRow): Group => ({
  id: row.id,
  name: row.name,
  image: row.image ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  teamId: "",
});

/** get_group RPC는 이미 기존 형태(camelCase, members, taskLists)로 조립한다 */
export const mapGroupDetail = (json: Omit<GetGroupsResponse, "teamId">): GetGroupsResponse => ({
  ...json,
  image: json.image ?? "",
  teamId: "",
});
