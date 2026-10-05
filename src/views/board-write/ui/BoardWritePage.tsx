import { PageLayout } from "@/shared/ui/page-layout";
import { ArticleForm } from "@/features/article/write-article";

const DashboardWritePage = () => {
  return (
    <PageLayout>
      <section className="bg-background-primary max-w-[900px] rounded-[20px] py-14 px-10">
        <h2 className="text-text-primary text-xl-bold">게시글 쓰기</h2>
        <ArticleForm />
      </section>
    </PageLayout>
  );
};

export default DashboardWritePage;
