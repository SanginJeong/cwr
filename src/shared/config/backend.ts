/**
 * 백엔드 전환 스위치 (docs/backend-migration-plan.md Phase 3)
 *
 * NEXT_PUBLIC_BACKEND=supabase 이면 Supabase, 그 외(미설정 포함)는 기존 API.
 * 인증이 백엔드마다 달라서 도메인별로 섞어 쓸 수 없다. 앱 전체가 한쪽만 쓴다.
 * 전환이 끝나면(Phase 5) legacy 분기와 함께 이 파일을 지운다.
 */
export const BACKEND = process.env.NEXT_PUBLIC_BACKEND === "supabase" ? "supabase" : "legacy";

export const isSupabase = BACKEND === "supabase";
