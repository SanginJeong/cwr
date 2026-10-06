-- PostgREST는 public 스키마의 함수를 모두 /rpc로 노출한다.
-- RPC 안에서만 쓰는 내부 함수는 직접 호출하지 못하게 막는다.
-- (RLS 정책과 컬럼 기본값에서 쓰는 current_profile_id, is_member, is_admin, can_access_* 는 열어 둔다)

revoke execute on function public.require_login() from public, anon, authenticated;
revoke execute on function public.require_task_list(bigint) from public, anon, authenticated;
revoke execute on function public.require_task(bigint) from public, anon, authenticated;
revoke execute on function public.group_json(public.groups) from public, anon, authenticated;
revoke execute on function public.member_json(public.memberships, public.profiles) from public, anon, authenticated;
revoke execute on function public.user_json(bigint) from public, anon, authenticated;
revoke execute on function public.task_json(public.tasks) from public, anon, authenticated;
revoke execute on function public.recurring_json(public.recurrings) from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.set_task_list_display_index() from public, anon, authenticated;
