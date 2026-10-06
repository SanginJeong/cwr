"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { getMemberToday, useTeamAttendanceRange } from "@/entities/attendance";
import { useGetGroups } from "@/entities/team";
import { useIsHrAdmin, useIsTeamLeader } from "@/entities/user";
import { toKstDateString } from "@/shared/lib/kstDate";
import { DeleteMemberModal } from "@/features/team/manage-member";
import { GroupMember } from "@/shared/api/types/GroupData";
import MemberList from "./_internal/MemberList";
import TeamTodayCard from "./_internal/TeamTodayCard";

/**
 * 팀 페이지의 "멤버" 영역. 초대 링크는 없다 (멤버 배정은 인사담당자, ADR-006).
 * 팀장·인사담당자에게는 오늘 우리 팀 근태와 멤버별 근태를 함께 보여준다 (roadmap H4).
 * PC에서는 진행 상황 오른쪽, 태블릿·모바일에서는 진행 상황 아래에 놓인다 (views/team).
 */
const MemberPanel = () => {
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

  const { teamId } = useParams();
  const groupId = Number(teamId);
  const { data: group } = useGetGroups({ id: groupId });

  const isHrAdmin = useIsHrAdmin();
  const isTeamLeader = useIsTeamLeader();
  const canSeeAttendance = isHrAdmin || isTeamLeader;
  const requestDate = toKstDateString(new Date());
  const { data: teamAttendance, isPending: isAttendanceLoading } = useTeamAttendanceRange(
    { groupId, from: requestDate, to: requestDate },
    canSeeAttendance && !!groupId,
  );
  const today = teamAttendance?.today ?? requestDate;
  const memberToday = teamAttendance?.members.map((member) => getMemberToday(member, today)) ?? [];

  if (!group) return null;

  return (
    <aside
      aria-label="팀 멤버"
      className="w-full pc:w-[320px] shrink-0 grid gap-4 tablet:grid-cols-2 pc:flex pc:flex-col"
    >
      {canSeeAttendance && <TeamTodayCard today={today} members={memberToday} isLoading={isAttendanceLoading} />}
      <MemberList
        groupId={groupId}
        members={group.members}
        attendanceByUser={canSeeAttendance ? new Map(memberToday.map((m) => [m.userId, m])) : undefined}
        onClickDelete={setSelectedMember}
      />

      <DeleteMemberModal
        isOpen={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </aside>
  );
};

export default MemberPanel;
