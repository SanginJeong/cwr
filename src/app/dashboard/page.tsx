import Link from "next/link";
import FloatingButton from "@/common/Button/FloatingButton";
import PageLayout from "@/common/PageLayout/PageLayout";
import DashBoardHeader from "./_components/Section/DashBoardHeader/DashBoardHeader";
import DashBoardBestArticles from "./_components/Section/DashBoardBestArticles/DashBoardBestArticles";
import DashBoardAllArticles from "./_components/Section/DashBoardAllArticles/DashBoardAllArticles";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 자유게시판",
  description: "게시글을 통해 팀원들과 소통해보세요.",
};

const DashboardPage = () => {
  return (
    <PageLayout>
      <section className="max-w-[1120px]">
        <DashBoardHeader />
        {/* PC: 피드 + 오른쪽 사이드(베스트), 모바일·태블릿: 베스트 캐러셀 → 피드 */}
        <div className="flex flex-col pc:mt-10 pc:flex-row-reverse pc:items-start pc:justify-between pc:gap-10">
          <aside className="pc:sticky pc:top-10 pc:w-[320px] pc:shrink-0">
            <DashBoardBestArticles />
          </aside>
          <div className="min-w-0 pc:max-w-[680px] pc:flex-1">
            <DashBoardAllArticles />
          </div>
        </div>
        <Link href="/dashboard/write" className="block">
          <FloatingButton
            iconName="pencil"
            className="fixed right-4 bottom-4 tablet:right-6 tablet:bottom-6 pc:right-10 pc:bottom-10"
          />
        </Link>
      </section>
    </PageLayout>
  );
};

export default DashboardPage;
