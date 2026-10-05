import { CenteredCardLayout } from "@/shared/ui/centered-card-layout";
import { TeamJoinForm } from "@/features/team/join-team";

const TeamJoinPage = () => {
  return (
    <CenteredCardLayout
      className="min-w-[343px] max-w-[550px] min-h-[353px] max-h-[400px] gap-10"
      title="팀 참여하기"
      titleClassName="w-full text-left"
    >
      <TeamJoinForm />
    </CenteredCardLayout>
  );
};

export default TeamJoinPage;
