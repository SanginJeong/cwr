import PageLayout from "@/shared/ui/page-layout/PageLayout";
import MemberWidget from "@/widgets/team-member/ui/MemberWidget";
import ProgressWidget from "@/widgets/team-progress/ui/ProgressWidget";
import TaskSection from "@/widgets/task-list-board/ui/TaskSection";

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
