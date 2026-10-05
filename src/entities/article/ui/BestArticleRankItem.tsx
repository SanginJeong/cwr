import Link from "next/link";
import { Icon } from "@/shared/ui/icon";
import { ArticleListItem } from "@/shared/api/types/ArticleType";
import ArticleLike from "./_internal/ArticleLike";

interface BestArticleRankItemProps {
  article: ArticleListItem;
  rank: number;
}

const BestArticleRankItem = ({ article, rank }: BestArticleRankItemProps) => {
  return (
    <Link
      href={`/dashboard/${article.id}`}
      className="flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-background-tertiary"
    >
      <span className="w-5 shrink-0 text-lg-bold text-brand-primary">{rank}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-md-semibold text-text-primary line-clamp-1 break-all">{article.title}</p>
        <span className="flex items-center gap-2 text-xs-medium text-state-400">
          <span className="truncate">{article.writer.nickname}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Icon name="heartDefault" className="size-3 tablet:size-3" />
            <ArticleLike likeCount={article.likeCount} />
          </span>
        </span>
      </div>
    </Link>
  );
};

export default BestArticleRankItem;
