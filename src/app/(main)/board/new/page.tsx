import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 글쓰기",
  description: "게시글을 작성하여 팀원들과 공유해보세요.",
};

export { BoardWritePage as default } from "@/views/board-write";
