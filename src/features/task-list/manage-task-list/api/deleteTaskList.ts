import instance from "@/shared/api/instance";
import { DeleteTaskListRequest } from "@/shared/api/types/taskListApi";
import { deleteTaskListWithSupabase } from "./taskList.supabase";
import { isSupabase } from "@/shared/config/backend";

const deleteTaskList = async ({ groupId, id }: DeleteTaskListRequest) => {
  if (isSupabase) return deleteTaskListWithSupabase(id);

  const response = await instance.delete(`/groups/${groupId}/task-lists/${id}`);

  return response.data;
};

export default deleteTaskList;
