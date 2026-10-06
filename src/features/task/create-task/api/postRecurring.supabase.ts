import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { PostTaskRequest, PostTaskResponse } from "@/shared/api/types/recurringApi";
import { toKstDateString } from "@/shared/lib/kstDate";
import { rpcJson } from "@/shared/api/supabase/types";

const postRecurringWithSupabase = async ({ taskListId, body }: PostTaskRequest): Promise<PostTaskResponse> => {
  const { data, error } = await getSupabase().rpc("create_recurring", {
    p_task_list_id: taskListId,
    p_name: body.name,
    p_frequency_type: body.frequencyType,
    p_description: body.description || undefined,
    p_start_date: body.startDate ? toKstDateString(body.startDate) : undefined,
    p_week_days: body.weekDays ?? [],
    p_month_day: body.monthDay ?? undefined,
  });
  if (error) throw toApiError(error, "할 일을 만들지 못했습니다.");
  const recurring = rpcJson("create_recurring", data);
  return { ...recurring, description: recurring.description ?? "", weekDays: recurring.weekDays.map(Number) };
};

export default postRecurringWithSupabase;
