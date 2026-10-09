"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui/icon";
import { useArticleSearchParams } from "@/features/article/search-article";
import { cn } from "@/shared/lib/cn";

const DashBoardHeader = () => {
  const { keyword, setKeyword } = useArticleSearchParams();
  // 입력은 로컬 state로 받아 한글 조합이 끊기지 않게 하고, 300ms 뒤 URL(?q=)에 반영한다
  const [value, setValue] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 뒤로가기 등으로 URL 검색어가 바뀌면 입력값도 맞춘다
  if (keyword !== syncedKeyword) {
    setSyncedKeyword(keyword);
    if (keyword !== value.trim()) setValue(keyword);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleChange = (next: string) => {
    setValue(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setKeyword(next), 300);
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    import("web-vitals/attribution").then(({ onINP }) => {
      onINP(
        (metric) => {
          const color =
            metric.rating === "good"
              ? "color: green"
              : metric.rating === "needs-improvement"
                ? "color: orange"
                : "color: red";
          console.groupCollapsed(`%c[INP] ${metric.value}ms (${metric.rating})`, color);
          console.log("attribution:", metric.attribution);
          console.groupEnd();
        },
        { reportAllChanges: true },
      );
    });
  }, []);

  return (
    <header className="flex flex-col gap-5 pc:flex-row pc:justify-between pc:items-center">
      <h2 className="text-xl-bold tablet:text-2xl-bold text-text-primary">자유게시판</h2>
      <form className="flex items-center relative w-full pc:w-auto" onSubmit={(e) => e.preventDefault()}>
        <Icon name="search" className="size-8 tablet:size-8 text-icon-brand absolute left-3" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="검색어를 입력해주세요"
          className={cn(
            "w-full h-[48px] py-4 px-12",
            "pc:w-[420px] pc:h-[56px]",
            "border border-border-primary rounded-full bg-transparent",
            "focus:border-interaction-focus focus:outline-none",
            "text-lg-regular text-text-primary placeholder:text-gray-400",
          )}
        />
      </form>
    </header>
  );
};

export default DashBoardHeader;
