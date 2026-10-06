import ImgEmptyTeam from "@/shared/assets/images/empty-team.png";
import Image from "next/image";
import { BaseButton } from "@/shared/ui/button";
import { PageLayout } from "@/shared/ui/page-layout";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import { getServerFirstVisibleTeamId, getServerMe } from "@/shared/api/serverApi";

const EmptyTeamPage = async () => {
  // 소속 팀이 있으면 첫 번째 팀으로 보낸다. 인사담당자는 소속이 없어도 회사의 첫 팀으로
  const user = await getServerMe();
  const isHrAdmin = user?.companyRole === "HR_ADMIN";
  const groupId = isHrAdmin ? await getServerFirstVisibleTeamId() : user?.memberships?.[0]?.groupId;
  if (groupId) redirect(ROUTES.team(groupId));

  return (
    <PageLayout ariaLabel="팀 페이지">
      <section className="flex-col-center gap-[80px] mx-auto py-[20px] max-w-[300px] tablet:max-w-[528px] pc:max-w-[660px] h-[566px]">
        <div className="flex-col-center gap-8">
          <Image src={ImgEmptyTeam} alt="그룹 없음 이미지" placeholder="empty" />
          <p className="flex-col-center gap-1 text-md-medium text-text-default">
            {/* 팀 배정은 인사담당자가 한다 (ADR-006) */}
            {isHrAdmin ? (
              <>
                <span>아직 회사에 팀이 없습니다.</span>
                <span>첫 팀을 만들어보세요.</span>
              </>
            ) : (
              <>
                <span>아직 소속된 팀이 없습니다.</span>
                <span>팀 배정은 인사담당자에게 문의해주세요.</span>
              </>
            )}
          </p>
        </div>

        {isHrAdmin && (
          <div className="w-[186px]">
            <Link href={ROUTES.teamNew}>
              <BaseButton variant="solid" size="large">
                팀 생성하기
              </BaseButton>
            </Link>
          </div>
        )}
      </section>
    </PageLayout>
  );
};

export default EmptyTeamPage;
