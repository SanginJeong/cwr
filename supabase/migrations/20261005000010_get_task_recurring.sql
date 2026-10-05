-- 할 일 상세(GET .../tasks/{id})는 기존 API처럼 반복 일정 객체(recurring)도 함께 준다.
-- 상세 화면의 댓글 영역이 recurring.groupId, recurring.taskListId를 쓴다.

create or replace function public.get_task(p_task_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_task public.tasks := public.require_task(p_task_id);
begin
  return public.task_json(v_task) || jsonb_build_object(
    'recurring', (select public.recurring_json(r) from public.recurrings r where r.id = v_task.recurring_id)
  );
end;
$$;
