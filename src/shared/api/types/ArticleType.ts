interface ArticleBase {
  updatedAt: string;
  createdAt: string;
  likeCount: number;
  writer: {
    nickname: string;
    id: number;
  };
  image: string;
  title: string;
  content: string;
  id: number;
}

export type ArticleListItem = ArticleBase;

export interface ArticleDetail extends ArticleBase {
  commentCount: number;
  isLiked: boolean;
}
