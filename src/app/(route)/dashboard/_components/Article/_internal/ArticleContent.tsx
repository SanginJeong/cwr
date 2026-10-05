import { cn } from "@/utils";
import Image from "next/image";
import isValidImageUrl from "./isValidImageUrl";

interface ArticleContentProps {
  content: string;
  image: string | null;
  imgSize: number;
  layout?: "row" | "column";
}

const ArticleContent = ({ content, image, imgSize, layout = "column" }: ArticleContentProps) => {
  const isRow = layout === "row";
  return (
    <div className={cn("min-h-[60px]", isRow ? "flex items-center justify-between gap-3" : "flex flex-col")}>
      <p className="flex-1 text-md-regular text-text-default line-clamp-1 overflow-hidden break-all">{content}</p>

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
