import { cn } from "@/shared/lib/cn";
import Image from "next/image";
import isValidImageUrl from "./isValidImageUrl";

interface ArticleContentProps {
  content: string;
  image: string | null;
  imgSize: number;
  layout?: "row" | "column";
  /** 본문 전체를 줄바꿈 그대로 보여준다 (상세 페이지). 기본은 카드용 한 줄 말줄임 */
  full?: boolean;
}

const ArticleContent = ({ content, image, imgSize, layout = "column", full = false }: ArticleContentProps) => {
  const isRow = layout === "row";
  return (
    <div
      className={cn(
        "min-h-[60px]",
        isRow ? "flex items-center justify-between gap-3" : "flex flex-col",
        full && "gap-4",
      )}
    >
      <p
        className={cn(
          "flex-1 text-md-regular",
          full
            ? "text-text-secondary whitespace-pre-wrap break-words"
            : "text-text-default line-clamp-1 overflow-hidden break-all",
        )}
      >
        {content}
      </p>

      {image && isValidImageUrl(image) && (
        <Image
          src={image}
          alt="게시글 이미지"
          quality={100}
          width={imgSize}
          height={imgSize}
          className="shrink-0 rounded-xl object-cover"
        />
      )}
    </div>
  );
};

export default ArticleContent;
