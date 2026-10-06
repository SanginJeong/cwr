import { PostTaskRequest, PostTaskResponse } from "@/shared/api/types/recurringApi";
import postRecurringWithSupabase from "./postRecurring.supabase";

const postRecurring = async ({ groupId, taskListId, body }: PostTaskRequest): Promise<PostTaskResponse> => {
  return postRecurringWithSupabase({ groupId, taskListId, body });
};

export default postRecurring;
