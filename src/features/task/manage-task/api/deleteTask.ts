import instance from "@/shared/api/instance";
import { DeleteTaskRequest } from "@/shared/api/types/taskApi";

const deleteTask = async ({ groupId, taskListId, taskId }: DeleteTaskRequest) => {
  const response = await instance.delete(`/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`);

  return response.data;
};

export default deleteTask;
