import instance from "@/shared/api/instance";
import { PatchTaskRequest } from "@/shared/api/types/taskApi";

const patchTask = async ({ groupId, id, name }: PatchTaskRequest) => {
  const response = await instance.patch(`/groups/${groupId}/task-lists/${id}`, { name });

  return response.data;
};

export default patchTask;
