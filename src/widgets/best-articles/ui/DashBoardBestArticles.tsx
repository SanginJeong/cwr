"use client";

import { useGetArticles } from "@/entities/article";
import { BestArticleCard } from "@/entities/article";
import { BestArticleRankItem } from "@/entities/article";
import useDevice from "@/shared/lib/useDevice";
import { useState } from "react";
import Pagination from "./_internal/Pagination";

const PC_RANK_SIZE = 5;

const DashBoardBestArticles = () => {
  const { isMobile, isTablet, isPc } = useDevice();
  const [page, setPage] = useState(1);
  // PC는 사이드 영역에 순위 목록(5개), 모바일·태블릿은 캐러셀
  const pageSize = isPc ? PC_RANK_SIZE : isMobile ? 1 : isTablet ? 2 : 3;

  const { data: articles } = useGetArticles({ page, pageSize, orderBy: "like" });

  if (!articles) {
    return null;
  }

  if (isPc) {
    return (
      <section className="rounded-[20px] bg-background-secondary p-5">
        <h3 className="text-text-primary text-lg-bold mb-3 px-3">베스트 게시글</h3>
        <ol className="flex flex-col">
          {articles.list.map((article, index) => (
            <li key={article.id}>
              <BestArticleRankItem article={article} rank={index + 1} />
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const totalPages = Math.ceil(articles?.totalCount / pageSize);

  return (
    <section className="gap-5 -mx-4 tablet:-mx-[26px] pc:-mx-0 pc:px-8 py-10 mt-10 bg-background-secondary pc:rounded-[20px]">
      <div className="px-4 tablet:px-[26px] pc:px-8">
        <h3 className="text-text-primary text-xl-bold mb-4">베스트 게시글</h3>
        <ul className="grid grid-cols-1 tablet:grid-cols-2 pc:grid-cols-3 gap-4 items-stretch">
          {articles?.list.map((article) => (
            <li className="h-full" key={article.id}>
              <BestArticleCard article={article} />
            </li>
          ))}
        </ul>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        maxDots={5}
        onPrev={() => setPage((prev) => (prev === 1 ? totalPages : prev - 1))}
        onNext={() => setPage((prev) => (prev === totalPages ? 1 : prev + 1))}
      />
    </section>
  );
};

export default DashBoardBestArticles;
