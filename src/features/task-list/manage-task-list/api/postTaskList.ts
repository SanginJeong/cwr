import { PostTaskListRequest, PostTaskListResponse } from "@/shared/api/types/taskListApi";
import { postTaskListWithSupabase } from "./taskList.supabase";

const postTaskList = async ({ groupId, name }: PostTaskListRequest): Promise<PostTaskListResponse> => {
  return postTaskListWithSupabase({ groupId, name });
};

export default postTaskList;
