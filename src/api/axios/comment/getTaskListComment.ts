import instance from "@/lib/axios";
import { GetTaskListCommentRequest, GetTaskListCommentResponse } from "./_types";

const getTaskListComment = async ({ taskId }: GetTaskListCommentRequest): Promise<GetTaskListCommentResponse[]> => {
  const response = await instance.get<GetTaskListCommentResponse[]>(`/tasks/${taskId}/comments`);
  const reversedData = response.data.reverse();

  return reversedData || [];
};

export default getTaskListComment;
