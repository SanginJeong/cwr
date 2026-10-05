import ArticleBody from "./_internal/ArticleBody";
import ArticleComments from "./_internal/ArticleComments";
import { LinkButton } from "@/shared/ui/link-button";
import { ROUTES } from "@/shared/config/routes";

const ArticleDetail = () => {
  return (
    <section className="bg-background-primary max-w-[900px] rounded-[20px] py-14 px-10">
      <ArticleBody />
      <ArticleComments />
      <span className="flex-center">
        <LinkButton className="w-full tablet:w-[250px]" href={ROUTES.board}>
          목록으로
        </LinkButton>
      </span>
    </section>
  );
};

export default ArticleDetail;
