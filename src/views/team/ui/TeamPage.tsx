import { PageLayout } from "@/shared/ui/page-layout";
import { MemberWidget } from "@/widgets/team-member";
import { ProgressWidget } from "@/widgets/team-progress";
import { TaskSection } from "@/widgets/task-list-board";

const TeamDetailPage = async () => {
  return (
    <PageLayout ariaLabel="팀 페이지">
      <div className="w-full max-w-[1120px] relative">
        <ProgressWidget />
        <hr className="hidden pc:block border border-border-primary mt-8" />
        <TaskSection />
        <MemberWidget />
      </div>
    </PageLayout>
  );
};

export default TeamDetailPage;
