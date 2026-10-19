"use client";

import useDeleteArticleLike from "../api/useDeleteArticleLike";
import { useGetArticle } from "@/entities/article";
import usePostArticleLike from "../api/usePostArticleLike";
import { FloatingButton } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { useParams } from "next/navigation";
import { ArticleLike } from "@/entities/article";

const ArticleLikeButton = () => {
  const { articleId: id } = useParams();

  const articleId = Number(id);

  const { data: article } = useGetArticle({ articleId });
  const { mutate: postArticleLike } = usePostArticleLike();
  const { mutate: deleteArticleLike } = useDeleteArticleLike();

  if (!article) {
    return null;
  }
  const { isLiked } = article;
  const label = isLiked ? "좋아요 취소" : "좋아요";

  const handleLikeClick = () => {
    if (isLiked) {
      deleteArticleLike({ articleId });
    } else {
      postArticleLike({ articleId });
    }
  };

  // 넓은 화면에서는 본문 오른쪽 바깥(-120px)에 띄운다. 그 자리가 없는 폭(PC 940px~1399px)에서 띄우면
  // 화면 밖으로 나가 가로 스크롤이 생겼으므로, 그때는 모바일처럼 본문 아래 오른쪽에 둔다 (CSS로 고른다)
  return (
    <>
      <span className="hidden min-[1400px]:flex flex-col items-center gap-2 absolute right-[-120px]">
        <FloatingButton
          iconName={isLiked ? "heartActive" : "heartDefault"}
          ariaLabel={label}
          className="bg-background-inverse size-[64px]"
          onClick={handleLikeClick}
        />
        <ArticleLike likeCount={article?.likeCount} />
      </span>
      <button
        type="button"
        aria-label={label}
        className="min-[1400px]:hidden flex items-center gap-1 absolute right-0 bottom-[-40px] cursor-pointer"
        onClick={handleLikeClick}
      >
        <Icon name={isLiked ? "heartActive" : "heartDefault"} className="size-6 tablet:size-6" />
        <ArticleLike likeCount={article?.likeCount} />
      </button>
    </>
  );
};

export default ArticleLikeButton;
