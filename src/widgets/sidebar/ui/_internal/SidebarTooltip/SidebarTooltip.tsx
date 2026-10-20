"use client";

import { useEffect, useRef, useState } from "react";
import { Portal } from "@/shared/ui/portal";

interface SidebarTooltipProps {
  title: string;
}

/**
 * 접힌 사이드바의 메뉴 이름. 메뉴 영역이 세로 스크롤(overflow)이라 그 안에 absolute로 두면
 * 잘려 보이지 않고 가로 스크롤만 생긴다. 그래서 portal에 fixed로 그리고, 위치는 마우스를 올릴 때 잰다.
 * 대상은 감싸는 링크(없으면 부모 요소)
 */
const SidebarTooltip = ({ title }: SidebarTooltipProps) => {
  const anchor = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const parent = anchor.current?.parentElement;
    const target = parent?.closest("a") ?? parent;
    if (!target) return;

    const show = () => {
      const rect = target.getBoundingClientRect();
      const sidebarRight = target.closest("aside")?.getBoundingClientRect().right ?? rect.right;
      setPosition({ top: rect.top + rect.height / 2, left: sidebarRight + 12 });
    };
    const hide = () => setPosition(null);

    target.addEventListener("mouseenter", show);
    target.addEventListener("mouseleave", hide);
    target.addEventListener("focusin", show);
    target.addEventListener("focusout", hide);
    return () => {
      target.removeEventListener("mouseenter", show);
      target.removeEventListener("mouseleave", hide);
      target.removeEventListener("focusin", show);
      target.removeEventListener("focusout", hide);
    };
  }, []);

  return (
    <>
      <span ref={anchor} hidden />
      {position && (
        <Portal>
          <div
            role="presentation"
            className="pointer-events-none fixed z-50 -translate-y-1/2"
            style={{ top: position.top, left: position.left }}
          >
            <div className="bg-brand-primary/80 text-white text-sm-medium px-3 py-1.5 rounded-lg shadow-lg max-w-[220px] break-words">
              <span className="block truncate">{title}</span>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default SidebarTooltip;
