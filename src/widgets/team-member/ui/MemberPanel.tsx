"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useGetGroups } from "@/entities/team";
import { DeleteMemberModal } from "@/features/team/manage-member";
import { GroupMember } from "@/shared/api/types/GroupData";
import InviteCard from "./_internal/InviteCard";
import MemberList from "./_internal/MemberList";

/**
 * 팀 페이지의 "팀 초대하기"와 "멤버" 영역.
 * PC에서는 할 일 목록 오른쪽, 태블릿·모바일에서는 진행 상황 아래에 놓인다 (views/team).
 */
const MemberPanel = () => {
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

  const { teamId } = useParams();
  const groupId = Number(teamId);
  const { data: group } = useGetGroups({ id: groupId });

  if (!group) return null;

  return (
    <aside
      aria-label="팀 멤버"
      className="w-full pc:w-[248px] shrink-0 grid gap-4 tablet:grid-cols-2 pc:flex pc:flex-col pc:sticky pc:top-8"
    >
      <InviteCard groupId={groupId} />
      <MemberList groupId={groupId} members={group.members} onClickDelete={setSelectedMember} />

      <DeleteMemberModal
        isOpen={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </aside>
  );
};

export default MemberPanel;
