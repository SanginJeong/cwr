"use client";

import { FormEvent } from "react";
import useDevice from "@/shared/lib/useDevice";
import { ProfileEdit } from "@/shared/ui/profile";
import { Input } from "@/shared/ui/input";
import { BaseButton } from "@/shared/ui/button";
import { FloatingButton } from "@/shared/ui/button";
import useTeamEdit from "../../model/useTeamEdit";
import { useParams } from "next/navigation";
import { useGetGroups } from "@/entities/team";
import { LoadingSpinner } from "@/shared/ui/spinner";

/**
 * 팀 정보를 받은 뒤에 폼을 그린다. 폼은 이름·이미지 초기값을 첫 렌더에서 정하므로,
 * URL로 바로 들어와 캐시가 비어 있으면 이름 칸이 빈 채로 시작하던 문제가 있었다
 */
const TeamEditForm = () => {
  const { teamId } = useParams();
  const id = Number(teamId);
  const { data: group } = useGetGroups({ id });

  if (!group) return <LoadingSpinner className="py-16 flex-center" size="lg" />;
  return <TeamEditFormFields key={group.id} id={id} />;
};

const TeamEditFormFields = ({ id }: { id: number }) => {
  const { isMobile } = useDevice();
  const profileSize = isMobile ? "md" : "lg";

  const {
    name,
    errorMessage,
    preview,
    isValid,
    isSubmitting,
    handleNameChange,
    handleImageChange,
    handleSubmit,
    handleRemoveImage,
  } = useTeamEdit(id);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <form onSubmit={onSubmit} className="w-full flex-col-center gap-10">
      <div className="w-full flex-col-center gap-3 tablet:gap-6">
        <div className="relative">
          <ProfileEdit iconType="imgUpload" src={preview || null} onChange={handleImageChange} size={profileSize} />
          {preview && (
            <FloatingButton
              iconName="x"
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1 -right-1 size-6"
            />
          )}
        </div>
        <Input
          label="팀 이름"
          type="text"
          placeholder="팀 이름을 입력해주세요."
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          error={errorMessage}
          minLength={2}
          maxLength={30}
        />
      </div>

      <div className="w-full flex-col-center gap-5">
        <BaseButton type="submit" variant="solid" size="large" className="w-full" disabled={!isValid || isSubmitting}>
          {isSubmitting ? "수정 중..." : "수정하기"}
        </BaseButton>

        <p className="text-xs-regular text-text-default tablet:text-lg-regular text-center">
          팀 이름은 회사명이나 모임 이름 등으로 설정하면 좋아요.
        </p>
      </div>
    </form>
  );
};

export default TeamEditForm;
