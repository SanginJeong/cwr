import instance from "@/shared/api/instance";
import { DeleteTaskListRequest } from "@/shared/api/types/taskListApi";

const deleteTaskList = async ({ groupId, id }: DeleteTaskListRequest) => {
  const response = await instance.delete(`/groups/${groupId}/task-lists/${id}`);

  return response.data;
};

export default deleteTaskList;
