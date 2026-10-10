import { PageLayout } from "@/shared/ui/page-layout";
import { MemberPanel } from "@/widgets/team-member";
import { ProgressWidget } from "@/widgets/team-progress";
import { TaskSection } from "@/widgets/task-list-board";

const TeamDetailPage = async () => {
  return (
    <PageLayout ariaLabel="팀 페이지">
      <div className="w-full max-w-[1120px] relative">
        {/* PC: 진행 상황(왼쪽) + 팀 초대·멤버(오른쪽). 태블릿·모바일: 위에서 아래로 */}
        <div className="flex flex-col gap-6 pc:flex-row pc:items-stretch pc:gap-[30px]">
          {/* PC에서 진행 상황 카드를 오른쪽 패널 높이까지 늘리고 내용을 세로 가운데에 둔다 */}
          <div className="flex-1 min-w-0 pc:[&>section]:h-full pc:[&>section]:flex pc:[&>section]:flex-col pc:[&>section]:justify-center">
            <ProgressWidget />
          </div>
          <MemberPanel />
        </div>
        <hr className="hidden pc:block border border-border-primary mt-8" />
        <TaskSection />
      </div>
    </PageLayout>
  );
};

export default TeamDetailPage;
