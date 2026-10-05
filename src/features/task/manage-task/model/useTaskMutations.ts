import usePatchTaskDetail from "@/features/task/manage-task/api/usePatchTaskDetail";
import useDeleteTask from "@/features/task/manage-task/api/useDeleteTask";

interface UseTaskListMutationsProps {
  teamId: number;
  taskListId: number;
}

const useTaskMutations = ({ teamId, taskListId }: UseTaskListMutationsProps) => {
  const { mutate: patchTaskListDetailMutate } = usePatchTaskDetail();
  const { mutate: deleteTaskListDetailMutate } = useDeleteTask();

  const toggleTaskDone = (taskId: number, isDone: boolean) => {
    patchTaskListDetailMutate({
      groupId: teamId,
      taskListId,
      taskId,
      body: {
        done: !isDone,
      },
    });
  };

  const updateTask = (taskId: number, name: string, description?: string) => {
    patchTaskListDetailMutate({
      groupId: teamId,
      taskListId,
      taskId,
      body: {
        name,
        description,
      },
    });
  };

  const deleteTask = (taskId: number) => {
    deleteTaskListDetailMutate({
      groupId: teamId,
      taskListId,
      taskId,
    });
  };

  return {
    toggleTaskDone,
    updateTask,
    deleteTask,
  };
};

export default useTaskMutations;
