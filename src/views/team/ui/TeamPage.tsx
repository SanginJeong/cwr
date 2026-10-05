import { PageLayout } from "@/shared/ui/page-layout";
import { MemberPanel } from "@/widgets/team-member";
import { ProgressWidget } from "@/widgets/team-progress";
import { TaskSection } from "@/widgets/task-list-board";
import { TeamChatWidget } from "@/widgets/team-chat";

const TeamDetailPage = async () => {
  return (
    <PageLayout ariaLabel="팀 페이지">
      <div className="w-full max-w-[1120px] relative">
        {/* PC: 진행 상황(왼쪽) + 팀 초대·멤버(오른쪽). 태블릿·모바일: 위에서 아래로 */}
        <div className="flex flex-col gap-6 pc:flex-row pc:items-stretch pc:gap-[30px]">
          <div className="flex-1 min-w-0">
            <ProgressWidget />
          </div>
          <MemberPanel />
        </div>
        <hr className="hidden pc:block border border-border-primary mt-8" />
        <TaskSection />
      </div>
      <TeamChatWidget />
    </PageLayout>
  );
};

export default TeamDetailPage;
