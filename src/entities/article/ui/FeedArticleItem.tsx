import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/shared/ui/icon";
import { ArticleListItem } from "@/shared/api/types/ArticleType";
import ArticleWriter from "./_internal/ArticleWriter";
import ArticleLike from "./_internal/ArticleLike";
import isValidImageUrl from "./_internal/isValidImageUrl";
import { ROUTES } from "@/shared/config/routes";

// isLcp: 피드 첫 화면의 대표 이미지면 lazy 로딩을 끄고 먼저 받는다 (LCP)
const FeedArticleItem = ({ article, isLcp = false }: { article: ArticleListItem; isLcp?: boolean }) => {
  const hasImage = !!article.image && isValidImageUrl(article.image);

  return (
    <Link href={ROUTES.article(article.id)} className="group block">
      <article className="flex flex-col gap-3 px-4 py-6 tablet:px-6 transition-colors group-hover:bg-background-secondary/60">
        <ArticleWriter nickname={article.writer.nickname} createdAt={article.createdAt} />

        <div className="flex flex-col gap-2">
          <h4 className="text-lg-bold text-text-primary line-clamp-2 break-all">{article.title}</h4>
          <p className="text-md-regular text-text-secondary line-clamp-3 break-all whitespace-pre-line">
            {article.content}
          </p>
        </div>

        {hasImage && (
          <Image
            src={article.image}
            alt="게시글 이미지"
            width={680}
            height={383}
            sizes="(min-width: 940px) 680px, 100vw"
            loading={isLcp ? "eager" : "lazy"}
            fetchPriority={isLcp ? "high" : "auto"}
            className="w-full aspect-video rounded-xl border object-cover"
          />
        )}

        <footer className="flex items-center gap-1">
          <Icon name="heartDefault" className="size-4 tablet:size-4" />
          <ArticleLike likeCount={article.likeCount} />
        </footer>
      </article>
    </Link>
  );
};

export default FeedArticleItem;
