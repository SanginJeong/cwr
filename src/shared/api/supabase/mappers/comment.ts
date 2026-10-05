import type { TaskUser } from "@/shared/api/types/UserType";
import type { ViewRow } from "../types";

/** task_comment_view 행 */
export type TaskCommentRow = ViewRow<"task_comment_view", "user_image">;

export const mapTaskComment = (row: TaskCommentRow) => ({
  id: row.id,
  taskId: row.task_id,
  userId: row.user_id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  user: { id: row.user_id, nickname: row.user_nickname, image: row.user_image ?? "" } satisfies TaskUser,
});
