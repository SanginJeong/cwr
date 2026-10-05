import instance from "@/shared/api/instance";
import { GetTaskListCommentRequest, GetTaskListCommentResponse } from "@/shared/api/types/taskCommentApi";

const getTaskListComment = async ({ taskId }: GetTaskListCommentRequest): Promise<GetTaskListCommentResponse[]> => {
  const response = await instance.get<GetTaskListCommentResponse[]>(`/tasks/${taskId}/comments`);
  const reversedData = response.data.reverse();

  return reversedData || [];
};

export default getTaskListComment;
