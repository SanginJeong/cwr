import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { mapHistoryItem, TaskJson } from "@/shared/api/supabase/mappers/task";
import { GetHistoryResponse } from "@/shared/api/types/userApi";

const getHistoryWithSupabase = async (): Promise<GetHistoryResponse> => {
  const { data, error } = await getSupabase().rpc("user_history");
  if (error) throw toApiError(error, "완료한 할 일을 불러오지 못했습니다.");
  return { tasksDone: (data.tasksDone as TaskJson[]).map(mapHistoryItem) };
};

export default getHistoryWithSupabase;
