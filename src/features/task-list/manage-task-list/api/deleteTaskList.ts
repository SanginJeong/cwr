import { DeleteTaskListRequest } from "@/shared/api/types/taskListApi";
import { deleteTaskListWithSupabase } from "./taskList.supabase";

const deleteTaskList = async ({ id }: DeleteTaskListRequest) => {
  return deleteTaskListWithSupabase(id);
};

export default deleteTaskList;
