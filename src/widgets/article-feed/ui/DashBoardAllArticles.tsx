"use client";

import { Select } from "@/shared/ui/select";
import { useState, useEffect, useRef } from "react";
import { FeedArticleItem } from "@/entities/article";
import { SelectOption } from "@/shared/ui/select";
import { useArticleSearchStore } from "@/features/article/search-article";
import useDebounce from "@/shared/lib/useDebounce";
import { useGetArticlesInfinite } from "@/entities/article";
import { LoadingSpinner } from "@/shared/ui/spinner";
import { AnimatePresence, motion } from "framer-motion";

const DashBoardAllArticles = () => {
  const [orderBy, setOrderBy] = useState<"recent" | "like">("recent");
  const { keyword } = useArticleSearchStore();
  const debouncedValue = useDebounce(keyword, 300);

  const options: SelectOption<"recent" | "like">[] = [
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
    keyword: debouncedValue,
    pageSize: 6,
  });

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
          {articles?.pages.map((page) =>
            page.list.map((article) => (
              <motion.li
                key={article.id}
                initial={{ opacity: 0, x: 0, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true, amount: 0.5 }}
              >
                <FeedArticleItem article={article} />
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
