"use client";

import { useDeleteArticleComment } from "@/features/article-comment/manage-comment";
import { useGetArticle } from "@/entities/article";
import { useGetArticleComments } from "@/entities/article-comment";
import { useGetUser } from "@/entities/user";
import { usePostArticleComment } from "@/features/article-comment/manage-comment";
import { Dropdown } from "@/shared/ui/dropdown";
import { InputReply } from "@/shared/ui/input";
import { Profile } from "@/shared/ui/profile";
import useDevice from "@/shared/lib/useDevice";
import { formatTime } from "@/shared/lib/formatTime";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArticleEditCommentModal } from "@/features/article-comment/manage-comment";
import { ArticleCommentType } from "@/shared/api/types/ArticleCommentType";

const ArticleComments = () => {
  const { articleId: id } = useParams();
  const { isPc } = useDevice();
  const articleId = Number(id);

  const { data: userInfo } = useGetUser();
  const { data: article } = useGetArticle({ articleId });
  const {
    data: articleComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetArticleComments({ articleId });
  const { mutate: postArticleComment } = usePostArticleComment();
  const { mutate: deleteArticleComment } = useDeleteArticleComment();

  const [commentValue, setCommentValue] = useState("");
  const [selectedComment, setSelectedComment] = useState<ArticleCommentType | null>(null);
  const [isOpenEditCommentModal, setIsOpenEditCommentModal] = useState(false);

  const handleCommentSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    postArticleComment(
      { articleId, body: { content: commentValue } },
      {
        onSuccess: () => setCommentValue(""),
      },
    );
  };

  if (!article || !articleComments) {
    return null;
  }

  return (
    <section className="flex flex-col gap-9 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 text-lg-bold text-text-primary">
          <span>댓글</span>
          <span className="text-brand-primary">{article.commentCount}</span>
        </div>
        <form aria-label="댓글 작성" className="flex items-center gap-3 w-full" onSubmit={handleCommentSubmit}>
          <Profile src={userInfo?.image ?? null} />
          <InputReply value={commentValue} onChange={setCommentValue} isSubmitting={false} />
        </form>
      </div>

      {/* TODO(상인): 추후 시간 남으면 컴포넌트로 빼기 */}
      <ul className="flex flex-col gap-5">
        {articleComments.list.map((comment) => (
          <li key={comment.id} className="flex gap-2 items-start border-t border-border-primary py-4">
            <Profile src={comment.writer.image} />
            <div className="flex-1">
              <span className="text-text-primary text-md-bold">{comment.writer.nickname}</span>
              <p className="text-text-primary text-md-regular">{comment.content}</p>
              <span className="text-state-400 text-md-regular">{formatTime(comment.createdAt)}</span>
            </div>
            {userInfo?.id === comment.writer.id && (
              <Dropdown
                iconName="kebab"
                options={[
                  {
                    label: "수정하기",
                    action: () => {
                      setIsOpenEditCommentModal(true);
                      setSelectedComment(comment);
                    },
                  },
                  { label: "삭제하기", action: () => deleteArticleComment({ commentId: comment.id }) },
                ]}
                placement={isPc ? "bottom-left" : "bottom-right"}
              />
            )}
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="self-center h-11 px-6 rounded-xl border border-border-secondary text-md-semibold text-text-secondary hover:bg-background-tertiary disabled:opacity-60"
        >
          {isFetchingNextPage ? "불러오는 중..." : "댓글 더보기"}
        </button>
      )}

      <ArticleEditCommentModal
        comment={selectedComment}
        isOpen={isOpenEditCommentModal}
        onClose={() => setIsOpenEditCommentModal(false)}
      />
    </section>
  );
};

export default ArticleComments;
