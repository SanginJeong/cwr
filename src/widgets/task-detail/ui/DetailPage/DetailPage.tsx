"use client";

import { cn } from "@/shared/lib/cn";
import { BaseButton } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import CommentSection from "../_internal/CommentSection/CommentSection";
import ContentSection from "../_internal/ContentSection/ContentSection";
import HeaderSection from "../_internal/HeaderSection/HeaderSection";
import { useGetTaskDetail } from "@/entities/task";
import { useTaskMutations } from "@/features/task/manage-task";
import { LoadingSpinner } from "@/shared/ui/spinner";
import { ErrorState } from "@/shared/ui/error-state";

interface DetailPageProps {
  id: number;
  teamId: number;
  taskListId: number;
}

const DetailPage = ({ id, teamId, taskListId }: DetailPageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 주소에서 task만 빼고 목록으로 간다. 예전에는 router.back()이라, 링크로 바로 열었으면 앱 밖으로 나갔다
  const onClickClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    params.delete("task-id");
    const query = params.toString();
    router.replace(`${ROUTES.taskList(teamId, taskListId)}${query ? `?${query}` : ""}`, { scroll: false });
  };

  // 모달이므로 Esc로 닫는다. 위에 다른 모달(수정·삭제 확인)이 열려 있으면 그 모달만 닫히게 둔다
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelectorAll('[aria-modal="true"]').length > 1) return;
      onClickClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  });

  const {
    data: taskDetail,
    isPending: isPendingTaskDetail,
    isError: isErrorTaskDetail,
  } = useGetTaskDetail({
    groupId: teamId,
    taskListId: taskListId,
    taskId: id,
  });

  const isDone = taskDetail?.doneAt !== null;

  const { toggleTaskDone } = useTaskMutations({ teamId, taskListId });

  return (
    <>
      <article
        role="dialog"
        aria-modal="true"
        className={cn(
          "w-full min-h-[calc(100vh-52px)] flex flex-col px-4 py-3 space-y-6 bg-background-primary",
          "fixed inset-x-0 inset-y-10 z-[999] shadow-lg hide-scrollbar",
          "tablet:top-0 tablet:bottom-0 tablet:right-0 tablet:left-auto",
          "tablet:w-[520px] tablet:min-w-[520px]",
          "pc:w-[420px] pc:min-w-[420px]",
          "pc:max-h-[100vh] pc:overflow-y-auto pc:shadow-none",
        )}
      >
        <button aria-label="닫기" onClick={onClickClose}>
          <Icon name="x" className="size-6 tablet-6" />
        </button>

        {(isPendingTaskDetail || isErrorTaskDetail) && (
          <div className="w-full h-full flex-center">{isPendingTaskDetail ? <LoadingSpinner /> : <ErrorState />}</div>
        )}

        {!isPendingTaskDetail && !isErrorTaskDetail && (
          <>
            <HeaderSection
              data={taskDetail}
              isDone={isDone}
              taskPath={{
                id,
                teamId,
                taskListId,
              }}
            />

            <hr />

            <ContentSection content={taskDetail?.description ?? ""} />

            <CommentSection data={taskDetail} />
          </>
        )}
      </article>

      <BaseButton
        size="large"
        aria-label={isDone ? "완료 상태 취소하기" : "완료 상태로 변경하기"}
        variant={isDone ? "outlinedPrimary" : "solid"}
        onClick={() => toggleTaskDone(id, isDone)}
        className={cn(
          "fixed bottom-4 right-4 z-[999] max-w-[132px] h-[40px] rounded-[40px]",
          isDone && "bg-background-inverse",
        )}
      >
        <Icon name="check" className="size-4 tablet:size-4" />
        {isDone ? "완료 취소하기" : "완료하기"}
      </BaseButton>
    </>
  );
};

export default DetailPage;
