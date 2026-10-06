"use client";

import { useDeleteGroup } from "@/features/team/delete-team";
import { useGetGroups } from "@/entities/team";
import { BaseButton } from "@/shared/ui/button";
import { Dropdown } from "@/shared/ui/dropdown";
import { Icon } from "@/shared/ui/icon";
import { Modal } from "@/shared/ui/modal";
import { ProgressBar } from "@/shared/ui/progress-bar";
import { useParams, useRouter } from "next/navigation";
import { useIsHrAdmin } from "@/entities/user";
import { useState } from "react";
import { getCompletedTaskCount, getUncompletedTaskCount } from "@/entities/task";
import { ROUTES } from "@/shared/config/routes";

const ProgressWidget = () => {
  const { teamId } = useParams();
  const router = useRouter();
  const id = Number(teamId);

  const { data: groups } = useGetGroups({ id });
  const { mutate: deleteGroup, isPending } = useDeleteGroup();

  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);

  // 팀 수정·삭제는 인사담당자만 (ADR-006)
  const isHrAdmin = useIsHrAdmin();

  const DropdownOptions = [
    { label: "수정하기", action: () => router.push(ROUTES.teamEdit(id)) },
    { label: "삭제하기", action: () => setIsOpenDeleteModal(true) },
  ];

  const handleTeamDelete = () => {
    deleteGroup(
      { id },
      {
        onSettled: () => setIsOpenDeleteModal(false),
      },
    );
  };

  if (!groups) {
    return null;
  }
  const { taskLists } = groups;
  const completedCount = getCompletedTaskCount(taskLists);
  const uncompletedCount = getUncompletedTaskCount(taskLists);

  const totalCount = completedCount + uncompletedCount;

  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <section className="relative rounded-[20px] bg-background-primary px-[26px] py-[32px] -mx-[26px] -mt-[17px] tablet:mt-0 tablet:mx-0">
      <div className="w-full pc:w-[95%]">
        <h2 className="text-2xl-bold">{groups?.name}</h2>
        <dl className="flex justify-between mt-2 py-4">
          <div>
            <dt className="text-md-medium text-state-400">진행 상황</dt>
            <dd className="text-[40px] font-bold text-brand-primary">{progressPercent}%</dd>
          </div>
          <div className="flex items-center gap-7">
            <div className="text-center">
              <dt className="text-xs-medium text-state-400">할 일</dt>
              <dd className="text-[32px] font-bold text-text-default">{uncompletedCount}</dd>
            </div>
            <hr className="border border-border-primary h-[80%]" />
            <div>
              <dt className="text-xs-medium text-state-400">완료</dt>
              <dd className="text-[32px] font-bold text-brand-primary">{completedCount}</dd>
            </div>
          </div>
        </dl>
        <ProgressBar percent={progressPercent} />
      </div>

      {isHrAdmin && (
        <div className="absolute right-[26px] top-[32px] pc:bottom-[30px] pc:top-auto leading-none">
          <Dropdown iconName="setting" placement="bottom-right" options={DropdownOptions} />
        </div>
      )}

      {isOpenDeleteModal && (
        <Modal isOpen={isOpenDeleteModal} onClose={() => setIsOpenDeleteModal(false)}>
          <Modal.Body className="flex-col-center gap-4">
            <Icon name="alert" className="text-status-danger" />
            <p className="text-lg-medium pb-4">정말로 팀을 삭제하시겠습니까?</p>
          </Modal.Body>
          <Modal.Footer>
            <BaseButton variant="outlinedSecondary" size="large" onClick={() => setIsOpenDeleteModal(false)}>
              취소하기
            </BaseButton>
            <BaseButton variant="outlinedPrimary" size="large" danger onClick={handleTeamDelete} disabled={isPending}>
              삭제하기
            </BaseButton>
          </Modal.Footer>
        </Modal>
      )}
    </section>
  );
};

export default ProgressWidget;
