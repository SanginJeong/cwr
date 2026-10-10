"use client";

import { Select } from "@/shared/ui/select";
import { useEffect, useRef } from "react";
import { FeedArticleItem } from "@/entities/article";
import { SelectOption } from "@/shared/ui/select";
import { type ArticleOrderBy, useArticleSearchParams } from "@/features/article/search-article";
import { useGetArticlesInfinite } from "@/entities/article";
import { LoadingSpinner } from "@/shared/ui/spinner";
import { AnimatePresence, motion } from "framer-motion";

const DashBoardAllArticles = () => {
  // 검색어는 헤더 입력에서 debounce된 뒤 URL에 반영된다
  const { keyword, orderBy, setOrderBy } = useArticleSearchParams();

  const options: SelectOption<ArticleOrderBy>[] = [
    { label: "최신순", value: "recent" },
    { label: "좋아요순", value: "like" },
  ];

  const {
    data: articles,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useGetArticlesInfinite({
    orderBy,
    keyword,
    pageSize: 6,
  });

  // 첫 페이지에서 이미지가 있는 첫 게시글이 LCP 후보다
  const lcpArticleId = articles?.pages[0]?.list.find((article) => article.image)?.id;

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        threshold: 0,
        rootMargin: "0px",
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="mt-10 pc:mt-0">
      <div className="flex items-center justify-between">
        <h3 className="text-text-primary text-xl-bold">전체</h3>
        <Select value={orderBy} options={options} onChange={setOrderBy} />
      </div>

      <ul className="mt-6 -mx-4 tablet:-mx-[26px] pc:mx-0 flex flex-col divide-y divide-border-primary border-y border-border-primary">
        <AnimatePresence>
          {articles?.pages.map((page, pageIndex) =>
            page.list.map((article) => (
              <motion.li
                key={article.id}
                // 첫 페이지는 바로 보이게 둔다. opacity 0인 요소는 LCP 후보가 되지 않아 측정이 애니메이션 끝까지 밀린다
                initial={pageIndex === 0 ? false : { opacity: 0, x: 0, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true, amount: 0.5 }}
              >
                <FeedArticleItem article={article} isLcp={article.id === lcpArticleId} />
              </motion.li>
            )),
          )}
        </AnimatePresence>

        {isFetchingNextPage && <LoadingSpinner />}
      </ul>

      <div ref={observerRef} className="h-10" />
      {!hasNextPage && !isLoading && <p className="py-6 text-center text-state-400">더 이상 게시글이 없습니다.</p>}
    </div>
  );
};

export default DashBoardAllArticles;
