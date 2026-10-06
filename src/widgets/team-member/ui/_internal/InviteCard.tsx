"use client";

import { useGetInvitation } from "@/entities/team";
import { useCheckAdmin } from "@/entities/user";
import { isSupabase } from "@/shared/config/backend";
import { BaseButton } from "@/shared/ui/button";

interface InviteCardProps {
  groupId: number;
}

const InviteCard = ({ groupId }: InviteCardProps) => {
  const isAdmin = useCheckAdmin();
  const { mutate: copyInvitation, isPending } = useGetInvitation();

  // Supabase에서는 관리자만 초대 링크를 만들 수 있다 (ADR-004 §3). 기존 API는 누구나 가능
  const canInvite = isAdmin || !isSupabase;

  return (
    <section
      aria-labelledby="team-invite-title"
      className="rounded-[20px] bg-background-primary px-5 py-4 flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1">
        <h2 id="team-invite-title" className="text-lg-medium text-text-primary">
          팀 초대하기
        </h2>
        <p className="text-sm-medium text-text-default">
          {canInvite ? "초대 링크를 복사해 팀원에게 보내주세요." : "초대 링크는 관리자만 만들 수 있어요."}
        </p>
      </div>
      <BaseButton
        type="button"
        variant="outlinedPrimary"
        size="small"
        disabled={!canInvite || isPending}
        onClick={() => copyInvitation({ id: groupId })}
      >
        {isPending ? "링크 만드는 중..." : "초대 링크 복사"}
      </BaseButton>
    </section>
  );
};

export default InviteCard;
