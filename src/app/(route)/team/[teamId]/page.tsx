import PageLayout from "@/common/PageLayout/PageLayout";
import MemberWidget from "./_components/MemberWidget/MemberWidget";
import ProgressWidget from "./_components/ProgressWidget/ProgressWidget";
import TaskSection from "./_components/TaskSection/TaskSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 팀 페이지",
  description: "할 일들을 생성하고, 효율적인 업무 관리를 시작해보세요.",
};

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
