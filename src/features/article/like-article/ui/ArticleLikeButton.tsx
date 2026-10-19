"use client";

import useDeleteArticleLike from "../api/useDeleteArticleLike";
import { useGetArticle } from "@/entities/article";
import usePostArticleLike from "../api/usePostArticleLike";
import { FloatingButton } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { useParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { ArticleLike } from "@/entities/article";

const ArticleLikeButton = () => {
  const { articleId: id } = useParams();

  const articleId = Number(id);

  const { data: article } = useGetArticle({ articleId });
  const { mutateAsync: postArticleLike } = usePostArticleLike();
  const { mutateAsync: deleteArticleLike } = useDeleteArticleLike();

  // 낙관적 업데이트: 누르자마자 하트와 숫자를 바꾼다. transition이 끝나면(= 응답 후 상세를 다시 받으면)
  // 서버 값으로 바뀌고, 실패하면 저절로 원래 값으로 돌아간다 (에러 토스트는 mutation이 띄운다)
  const [isPending, startTransition] = useTransition();
  const [like, setOptimisticLike] = useOptimistic(
    { isLiked: article?.isLiked ?? false, likeCount: article?.likeCount ?? 0 },
    (_current, next: { isLiked: boolean; likeCount: number }) => next,
  );

  if (!article) {
    return null;
  }
  const { isLiked, likeCount } = like;
  const label = isLiked ? "좋아요 취소" : "좋아요";

  const handleLikeClick = () => {
    // 응답 전에 또 누르면 좋아요·취소 요청이 엇갈리므로 끝날 때까지 받지 않는다
    if (isPending) return;
    startTransition(async () => {
      setOptimisticLike({ isLiked: !isLiked, likeCount: likeCount + (isLiked ? -1 : 1) });
      try {
        await (isLiked ? deleteArticleLike : postArticleLike)({ articleId });
      } catch {
        // 실패 토스트는 mutation의 onError가 띄운다. 낙관적 값은 transition이 끝나며 되돌아간다
      }
    });
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
        <ArticleLike likeCount={likeCount} />
      </span>
      <button
        type="button"
        aria-label={label}
        className="min-[1400px]:hidden flex items-center gap-1 absolute right-0 bottom-[-40px] cursor-pointer"
        onClick={handleLikeClick}
      >
        <Icon name={isLiked ? "heartActive" : "heartDefault"} className="size-6 tablet:size-6" />
        <ArticleLike likeCount={likeCount} />
      </button>
    </>
  );
};

export default ArticleLikeButton;
