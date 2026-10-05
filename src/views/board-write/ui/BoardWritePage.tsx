import PageLayout from "@/shared/ui/page-layout/PageLayout";
import ArticleForm from "@/features/article/write-article/ui/ArticleForm";

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
