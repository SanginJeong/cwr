"use client";

import { useParams } from "next/navigation";
import { Dropdown } from "@/shared/ui/dropdown";
import useDevice from "@/shared/lib/useDevice";
import { useDeleteArticle } from "@/features/article/delete-article";
import { useGetArticle } from "@/entities/article";
import { useGetUser } from "@/entities/user";
import { ArticleTitle } from "@/entities/article";
import { ArticleWriter } from "@/entities/article";
import { ArticleContent } from "@/entities/article";
import { ArticleLikeButton } from "@/features/article/like-article";
import { ArticleEditModal } from "@/features/article/edit-article";
import { useState } from "react";
import { ApiError } from "@/shared/api/supabase/errors";

const ArticleBody = () => {
  const { articleId: id } = useParams();
  const { isPc } = useDevice();
  const articleId = Number(id);

  const { data: article, error } = useGetArticle({ articleId });
  const { data: userInfo } = useGetUser();
  const { mutate: deleteArticle } = useDeleteArticle();

  const [isOpenEditModal, setIsOpenEditModal] = useState(false);

  const options = [
    { label: "수정하기", action: () => setIsOpenEditModal(true) },
    { label: "삭제하기", action: () => deleteArticle({ articleId }) },
  ];

  // 없는 글(삭제됐거나 잘못된 주소)이면 빈 화면 대신 안내한다. 아래 "목록으로" 버튼은 ArticleDetail에 있다
  // 주소의 글 번호가 숫자가 아니면(/board/abc) 조회가 실패하므로 이것도 없는 글로 본다
  const isInvalidId = !Number.isInteger(articleId) || articleId <= 0;
  if (error || isInvalidId) {
    const isNotFound = isInvalidId || (error instanceof ApiError && error.status === 404);
    return (
      <div role="status" className="flex-col-center gap-2 py-16 text-center">
        <p className="text-xl-semibold text-text-primary">
          {isNotFound ? "게시글을 찾을 수 없어요" : "게시글을 불러오지 못했어요"}
        </p>
        <p className="text-md-regular text-text-default">
          {isNotFound ? "삭제되었거나 존재하지 않는 글이에요." : "잠시 후 다시 시도해 주세요."}
        </p>
      </div>
    );
  }

  if (!article || !userInfo) {
    return null;
  }

  return (
    <section className="relative">
      <div className="flex flex-col gap-4 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <ArticleTitle title={article.title} />
          {userInfo.id === article.writer.id && (
            <Dropdown iconName="kebab" options={options} placement={isPc ? "bottom-left" : "bottom-right"} />
          )}
        </div>
        <div className="pb-3">
          <ArticleWriter nickname={article.writer.nickname} createdAt={article.createdAt} />
        </div>
      </div>

      <div className="pt-6">
        <ArticleContent content={article.content} image={article.image} imgSize={200} full />
      </div>

      <ArticleLikeButton />

      {isOpenEditModal && (
        <ArticleEditModal
          key={article.id}
          isOpen={isOpenEditModal}
          onClose={() => setIsOpenEditModal(false)}
          article={article}
        />
      )}
    </section>
  );
};

export default ArticleBody;
