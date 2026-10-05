import { cn } from "@/utils/cn";
import EmptyState from "@/features/EmptyState/EmptyState";
import LoadingSpinner from "@/features/LoadingSpinner/LoadingSpinner";
import TaskListItem from "@/features/TaskListItem/TaskListItem";
import { GetHistoryResponse } from "@/api/axios/user/type";
import ErrorState from "@/features/ErrorState/ErrorState";

interface Props {
  data: GetHistoryResponse;
  isLoading: boolean;
  isError: boolean;
}

const WorkHistorySection = ({ data, isLoading, isError }: Props) => {
  const showState = isLoading || isError || data?.tasksDone?.length === 0;
  return (
    <article
      className={cn(
        "w-full max-w-[1120px] min-h-[500px] flex flex-col gap-6 px-[22px] py-[33px] rounded-[20px] bg-background-primary",
        "tablet:px-[30px] tablet:py-[46px]",
      )}
    >
      {showState && (
        <div className="flex-1 flex-center">
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorState />}
          {data?.tasksDone?.length === 0 && !isLoading && !isError && <EmptyState />}
        </div>
      )}
      {data?.tasksDone?.length > 0 && (
        <section>
          <ul className="flex flex-col gap-3">
            {data.tasksDone.map((item) => (
              <TaskListItem key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};

export default WorkHistorySection;
