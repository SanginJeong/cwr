import { CommentUser } from "@/types/CommentType";

export type ArticleCommentType = {
  writer: CommentUser;
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};
