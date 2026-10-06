"use client";

import { selectMyStatus, usePresenceStore } from "@/entities/presence";
import { useGetUser, useIsHrAdmin } from "@/entities/user";
import type { MemberToday } from "@/entities/attendance";
import { GroupMember } from "@/shared/api/types/GroupData";
import { PresenceStatus } from "@/shared/config/presence";
import MemberRow from "./MemberRow";

const STATUS_ORDER: Record<PresenceStatus, number> = { online: 0, away: 1, offline: 2 };

interface MemberListProps {
  groupId: number;
  members: GroupMember[];
  /** 팀장·인사담당자에게만 있다 */
  attendanceByUser?: Map<number, MemberToday>;
  onClickDelete: (member: GroupMember) => void;
}

const MemberList = ({ groupId, members, attendanceByUser, onClickDelete }: MemberListProps) => {
  const isHrAdmin = useIsHrAdmin();
  const { data: me } = useGetUser();
  const teamStatuses = usePresenceStore((state) => state.teams[groupId]);
  const myStatus = usePresenceStore(selectMyStatus);

  const statusOf = (member: GroupMember): PresenceStatus =>
    member.userId === me?.id ? myStatus : (teamStatuses?.[member.userId] ?? "offline");

  // 활동 중 → 자리 비움 → 오프라인, 같은 상태면 팀장 먼저
  const sorted = [...members].sort(
    (a, b) =>
      STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)] || Number(b.role === "ADMIN") - Number(a.role === "ADMIN"),
  );

  const onlineCount = members.filter((member) => statusOf(member) !== "offline").length;

  return (
    <section
      aria-labelledby="team-members-title"
      className="rounded-[20px] bg-background-primary px-5 py-4 flex flex-col gap-3 pc:flex-1 pc:min-h-0"
    >
      <header className="flex items-baseline justify-between">
        <h2 id="team-members-title" className="flex gap-2 text-lg-medium text-text-primary">
          멤버 <span className="text-lg-regular text-text-default">{members.length}</span>
        </h2>
        <span className="text-xs-regular text-text-default">접속 중 {onlineCount}</span>
      </header>
      {/* 멤버가 많아도 진행 상황 카드 높이를 크게 넘기지 않게 스크롤한다 */}
      <ul className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
        {sorted.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            groupId={groupId}
            myUserId={me?.id}
            attendance={attendanceByUser?.get(member.userId)}
            onClickDelete={isHrAdmin ? onClickDelete : undefined}
          />
        ))}
      </ul>
    </section>
  );
};

export default MemberList;
