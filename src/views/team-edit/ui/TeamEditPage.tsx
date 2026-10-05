import CenteredCardLayout from "@/shared/ui/centered-card-layout/CenteredCardLayout";
import EditTeamForm from "@/features/team/edit-team/ui/EditTeamForm/EditTeamForm";

const TeamEditPage = () => {
  return (
    <CenteredCardLayout
      title="팀 수정하기"
      titleClassName="w-full text-left"
      className="min-w-[343px] max-w-[550px] min-h-[464px] max-h-[543px] gap-8"
    >
      <EditTeamForm />
    </CenteredCardLayout>
  );
};

export default TeamEditPage;
