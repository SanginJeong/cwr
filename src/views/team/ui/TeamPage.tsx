import { PageLayout } from "@/shared/ui/page-layout";
import { MemberPanel } from "@/widgets/team-member";
import { ProgressWidget } from "@/widgets/team-progress";
import { TaskSection } from "@/widgets/task-list-board";

const TeamDetailPage = async () => {
  return (
    <PageLayout ariaLabel="팀 페이지">
      <div className="w-full max-w-[1120px] relative">
        <ProgressWidget />
        <hr className="hidden pc:block border border-border-primary mt-8" />
        {/* DOM 순서는 멤버 → 할 일 (모바일에서 멤버가 위). PC에서는 row-reverse로 멤버를 오른쪽에 둔다 */}
        <div className="flex flex-col gap-6 mt-6 pc:mt-8 pc:flex-row-reverse pc:items-start pc:gap-[30px]">
          <MemberPanel />
          <TaskSection />
        </div>
      </div>
    </PageLayout>
  );
};

export default TeamDetailPage;
