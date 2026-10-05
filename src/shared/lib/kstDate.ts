/**
 * 날짜를 KST 기준 "YYYY-MM-DD"로 바꾼다. Supabase RPC의 date 파라미터용.
 * 기존 API는 ISO 시각을 받아 서버에서 KST 날짜로 바꿨다 (behavior-spec §1).
 * 이미 "YYYY-MM-DD"면 그대로 둔다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const toKstDateString = (value: string | Date): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
};
