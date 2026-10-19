import postArticleLike from "./postArticleLike";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastKit } from "@/shared/lib/toastKit";

const usePostArticleLike = () => {
  const queryClient = useQueryClient();
  const { error } = toastKit();
  return useMutation({
    mutationFn: postArticleLike,
    // 다시 받을 때까지 기다린다. 낙관적 값(ArticleLikeButton)은 그동안 유지되다가 새 값으로 바뀐다
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["article"] }),
        // 목록(["articles"])도 좋아요 수를 보여준다. 예전에는 상세만 무효화해 목록이 staleTime(5분) 동안 예전 값이었다
        queryClient.invalidateQueries({ queryKey: ["articles"] }),
      ]),
    onError: (err: Error) => error(err.message),
  });
};

export default usePostArticleLike;
