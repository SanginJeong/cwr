"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * 하이드레이션이 끝난 뒤에만 그린다.
 * 서버 렌더와 하이드레이션 첫 렌더는 둘 다 null이라, 모달이 열린 채로 페이지를 처음 열어도
 * (?modal=new-task 새로고침 등) HTML이 어긋나지 않는다.
 */
const Portal = ({ children }: { children: ReactNode }) => {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isClient) return null;

  const root = document.getElementById("portal-root");
  if (!root) return null;

  return createPortal(children, root);
};

export default Portal;
