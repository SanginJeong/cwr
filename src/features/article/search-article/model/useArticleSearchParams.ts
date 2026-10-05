"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ArticleOrderBy = "recent" | "like";

/**
 * 게시판 검색어(?q=)와 정렬(?sort=like)을 URL 쿼리로 관리한다.
 * 새로고침·링크 공유 시 검색 상태가 유지된다. (history를 쌓지 않도록 replace 사용)
 */
const useArticleSearchParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keyword = searchParams.get("q") ?? "";
  const orderBy: ArticleOrderBy = searchParams.get("sort") === "like" ? "like" : "recent";

  const update = (key: string, value: string) => {
    // debounce 등으로 늦게 호출돼도 최신 쿼리를 기준으로 갱신한다
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return {
    keyword,
    orderBy,
    setKeyword: (next: string) => update("q", next.trim()),
    setOrderBy: (next: ArticleOrderBy) => update("sort", next === "recent" ? "" : next),
  };
};

export default useArticleSearchParams;
