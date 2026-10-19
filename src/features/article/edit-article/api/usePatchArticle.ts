import patchArticle from "./patchArticle";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const usePatchArticle = () => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["patchArticle"],
    mutationFn: patchArticle,
    onSuccess: (data) => {
      const articleId = data.id;
      success("게시물을 성공적으로 수정하였습니다.");
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      // 목록(["articles"])도 제목·좋아요·댓글 수를 보여준다. 예전에는 상세만 무효화해 목록이 staleTime(5분) 동안 예전 값이었다
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: () => {
      error("게시물을 수정하지 못하였습니다.");
    },
  });
};

export default usePatchArticle;
