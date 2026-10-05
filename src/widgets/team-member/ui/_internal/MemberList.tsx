"use client";

import { selectMyStatus, usePresenceStore } from "@/entities/presence";
import { useCheckAdmin, useGetUser } from "@/entities/user";
import { GroupMember } from "@/shared/api/types/GroupData";
import { isSupabase } from "@/shared/config/backend";
import { PresenceStatus } from "@/shared/config/presence";
import MemberRow from "./MemberRow";

const STATUS_ORDER: Record<PresenceStatus, number> = { online: 0, away: 1, offline: 2 };

interface MemberListProps {
  groupId: number;
  members: GroupMember[];
  onClickDelete: (member: GroupMember) => void;
}

const MemberList = ({ groupId, members, onClickDelete }: MemberListProps) => {
  const isAdmin = useCheckAdmin();
  const { data: me } = useGetUser();
  const teamStatuses = usePresenceStore((state) => state.teams[groupId]);
  const myStatus = usePresenceStore(selectMyStatus);

  const statusOf = (member: GroupMember): PresenceStatus =>
    member.userId === me?.id ? myStatus : (teamStatuses?.[member.userId] ?? "offline");

  // 활동 중 → 자리 비움 → 오프라인, 같은 상태면 관리자 먼저
  const sorted = isSupabase
    ? [...members].sort(
        (a, b) =>
          STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)] ||
          Number(b.role === "ADMIN") - Number(a.role === "ADMIN"),
      )
    : members;

  const onlineCount = isSupabase ? members.filter((member) => statusOf(member) !== "offline").length : null;

  return (
    <section aria-labelledby="team-members-title" className="rounded-xl bg-background-primary p-5 flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 id="team-members-title" className="flex gap-2 text-lg-medium text-text-primary">
          멤버 <span className="text-lg-regular text-text-default">{members.length}</span>
        </h2>
        {onlineCount !== null && <span className="text-xs-regular text-text-default">접속 중 {onlineCount}</span>}
      </header>
      {/* 태블릿·모바일에서는 할 일 목록을 너무 밀어내지 않게 높이를 제한한다 */}
      <ul className="flex flex-col gap-4 max-h-[260px] overflow-y-auto pc:max-h-none pc:overflow-visible">
        {sorted.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            groupId={groupId}
            myUserId={me?.id}
            onClickDelete={isAdmin && member.role !== "ADMIN" ? onClickDelete : undefined}
          />
        ))}
      </ul>
    </section>
  );
};

export default MemberList;
