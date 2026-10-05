import instance from "@/shared/api/instance";
import { PostTaskListRequest, PostTaskListResponse } from "@/shared/api/types/taskListApi";

const postTaskList = async ({ groupId, name }: PostTaskListRequest): Promise<PostTaskListResponse> => {
  const response = await instance.post<PostTaskListResponse>(`/groups/${groupId}/task-lists`, { name });

  return response.data;
};

export default postTaskList;
