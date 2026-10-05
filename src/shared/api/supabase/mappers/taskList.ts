import type { PostTaskListResponse } from "@/shared/api/types/taskListApi";

interface TaskListRow {
  id: number;
  group_id: number;
  name: string;
  display_index: number;
  created_at: string;
  updated_at: string;
}

export const mapTaskListRow = (row: TaskListRow): PostTaskListResponse => ({
  id: row.id,
  groupId: row.group_id,
  name: row.name,
  displayIndex: row.display_index,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
