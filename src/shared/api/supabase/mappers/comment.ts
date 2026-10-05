import type { TaskUser } from "@/shared/api/types/UserType";

/** task_comment_view 행 */
export interface TaskCommentRow {
  id: number;
  task_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  user_nickname: string;
  user_image: string | null;
}

export const mapTaskComment = (row: TaskCommentRow) => ({
  id: row.id,
  taskId: row.task_id,
  userId: row.user_id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  user: { id: row.user_id, nickname: row.user_nickname, image: row.user_image ?? "" } satisfies TaskUser,
});
