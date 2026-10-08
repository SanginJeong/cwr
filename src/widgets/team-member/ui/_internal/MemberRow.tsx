"use client";

import { formatClockTime, type MemberToday } from "@/entities/attendance";
import { useMemberStatus } from "@/entities/presence";
import { cn } from "@/shared/lib/cn";
import { GroupMember } from "@/shared/api/types/GroupData";
import { PRESENCE_LABEL } from "@/shared/config/presence";
import { Dropdown } from "@/shared/ui/dropdown";
import { Profile } from "@/shared/ui/profile";
import { TEAM_TODAY_LABEL, TEAM_TODAY_STYLE } from "./TeamTodayCard";

interface MemberRowProps {
  member: GroupMember;
  groupId: number;
  myUserId?: number;
  /** 오늘 근태 (팀장·인사담당자에게만). 접속 상태 점과는 별개다 */
  attendance?: MemberToday;
  /** 있으면 팀에서 제외하는 메뉴를 보여준다 (인사담당자가 볼 때, ADR-006) */
  onClickDelete?: (member: GroupMember) => void;
}

const MemberRow = ({ member, groupId, myUserId, attendance, onClickDelete }: MemberRowProps) => {
  const status = useMemberStatus(groupId, member.userId, myUserId);
  const isMe = member.userId === myUserId;

  return (
    <li className="flex items-center gap-3">
      <Profile src={member.userImage || null} alt={`${member.userName}의 프로필`} size="md" status={status} />
      <div className="flex flex-col flex-grow min-w-0">
        <p className="flex items-center gap-1.5 text-sm-semibold text-text-primary">
          <span className="truncate">{member.userName}</span>
          {isMe && <span className="text-xs-regular text-text-default">(나)</span>}
          {member.role === "ADMIN" && (
            <span className="shrink-0 rounded px-1.5 text-xs-medium bg-brand-secondary text-icon-brand">팀장</span>
          )}
        </p>
        <p className="text-xs-regular text-text-secondary truncate">
          {status ? PRESENCE_LABEL[status] : member.userEmail}
        </p>
      </div>
      {attendance?.kind && (
        <span
          className={cn("shrink-0 rounded-lg px-2 py-0.5 text-xs-semibold", TEAM_TODAY_STYLE[attendance.kind].chip)}
          title={attendance.clockOutAt ? `${formatClockTime(attendance.clockOutAt)} 퇴근` : undefined}
        >
          {TEAM_TODAY_LABEL[attendance.kind]}
          {attendance.clockInAt && ` ${formatClockTime(attendance.clockInAt)}`}
        </span>
      )}
      {onClickDelete && (
        <Dropdown
          label={`${member.userName} 메뉴`}
          iconName="kebab"
          iconClassName="size-4 tablet:size-4"
          options={[{ label: "팀에서 제외", action: () => onClickDelete(member) }]}
          placement="bottom-right"
        />
      )}
    </li>
  );
};

export default MemberRow;
