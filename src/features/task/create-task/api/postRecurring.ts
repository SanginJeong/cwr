import instance from "@/shared/api/instance";
import { PostTaskRequest, PostTaskResponse } from "@/shared/api/types/recurringApi";
import postRecurringWithSupabase from "./postRecurring.supabase";
import { isSupabase } from "@/shared/config/backend";

const postRecurring = async ({ groupId, taskListId, body }: PostTaskRequest): Promise<PostTaskResponse> => {
  if (isSupabase) return postRecurringWithSupabase({ groupId, taskListId, body });

  const response = await instance.post<PostTaskResponse>(`/groups/${groupId}/task-lists/${taskListId}/recurring`, body);

  return response.data;
};

export default postRecurring;
