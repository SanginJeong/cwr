"use client";

import { cn } from "@/utils";
import { Suspense, use, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TodoSection, TodoHeader, MakeTodoModal } from "./_components";
import { FloatingButton, PageHeaderBar, PageLayout } from "@/common";
import { DetailPage } from "./_detail/_components";
import { useGetGroups, useGetTask } from "@/api/hooks";
import { LoadingSpinner } from "@/features";

const subscribeNoop = () => () => {};

const TaskListPage = ({ params }: { params: Promise<{ teamId: number; taskListId: number }> }) => {
  const { teamId, taskListId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("task-id");

  const { data: groups, isPending: isPendingGroup, isError: isErrorGroup } = useGetGroups({ id: Number(teamId) });
  const taskListName = groups?.taskLists?.find((taskList) => taskList.id === Number(taskListId))?.name ?? "";

  const {
    data: taskList,
    isPending: isPendingTask,
    isError: isErrorTask,
  } = useGetTask({
    groupId: teamId,
    taskListId: taskListId,
    ...(searchParams.get("date") && { date: searchParams.get("date") }),
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get("date");
    if (!dateParam) return new Date();
    return new Date(dateParam);
  });

  // selectedDate는 로컬 타임존 기준으로 포맷되므로 서버(UTC)와 날짜가 어긋나지 않게 클라이언트에서만 렌더링
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const onClickFloatingButton = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("w", "true");

    router.push(`/team/${teamId}/task-list/${taskListId}?${params.toString()}`, { scroll: false });
  };

  const onClickDateItem = (date: Date) => {
    setSelectedDate(date);

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date.toISOString());

    router.replace(`/team/${teamId}/task-list/${taskListId}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={cn(selectedId && "pc:flex")}>
      <PageLayout ariaLabel="목록 페이지">
        <h1 className="sr-only">목록 페이지</h1>
        <PageHeaderBar title={groups?.name} id={teamId} />

        <div aria-label="목록 페이지 컨텐츠" className={cn("pc:flex pc:gap-[25px]")}>
          <TodoHeader data={groups} isPending={isPendingGroup} isError={isErrorGroup} groupId={teamId} />
          {isClient ? (
            <TodoSection
              sectionName={taskListName}
              data={taskList ?? []}
              teamId={teamId}
              onClickDateItem={onClickDateItem}
              selectedDate={selectedDate}
              taskListId={taskListId}
              taskStatus={{ isPending: isPendingTask, isError: isErrorTask }}
            />
          ) : (
            <LoadingSpinner />
          )}
        </div>
      </PageLayout>

      <FloatingButton
        iconName="plus"
        className="fixed bottom-2 right-2"
        iconClassName="size-6 tablet:size-6"
        onClick={onClickFloatingButton}
      />

      {selectedId && <DetailPage teamId={teamId} taskListId={taskListId} id={Number(selectedId)} />}
      {searchParams.get("w") && (
        <MakeTodoModal
          isOpen={!!searchParams.get("w")}
          onClose={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("w");
            router.push(`/team/${teamId}/task-list/${taskListId}?${params.toString()}`, { scroll: false });
          }}
          groupId={teamId}
          taskListId={taskListId}
        />
      )}
    </div>
  );
};

const Page = ({ params }: { params: Promise<{ teamId: number; taskListId: number }> }) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TaskListPage params={params} />
    </Suspense>
  );
};

export default Page;
