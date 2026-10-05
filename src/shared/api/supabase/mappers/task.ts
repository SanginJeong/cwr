import type { MyHistoryItem } from "@/shared/api/types/userApi";

/**
 * task_json(SQL)이 만드는 형태. 기존 API의 조회 응답과 같은 필드 이름이다.
 * date는 KST 자정 시각 (behavior-spec §1).
 */
export interface TaskJson {
  id: number;
  name: string;
  description: string | null;
  date: string;
  doneAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
  displayIndex: number;
  recurringId: number;
  frequency: MyHistoryItem["frequency"];
  startDate: string;
  writer: { id: number; nickname: string; image: string | null } | null;
  doneBy: { user: { id: number; nickname: string; image: string | null } | null };
  user: { id: number; nickname: string; image: string | null } | null;
  commentCount: number;
}

/** 기존 history 응답은 writer/doneBy 객체 대신 writerId/userId를 준다 */
export const mapHistoryItem = (task: TaskJson): MyHistoryItem => ({
  id: task.id,
  name: task.name,
  description: task.description ?? "",
  date: task.date,
  doneAt: task.doneAt ?? "",
  updatedAt: task.updatedAt,
  deletedAt: task.deletedAt ?? "",
  displayIndex: task.displayIndex,
  recurringId: task.recurringId,
  frequency: task.frequency,
  writerId: task.writer?.id ?? 0,
  userId: task.doneBy.user?.id ?? 0,
});
