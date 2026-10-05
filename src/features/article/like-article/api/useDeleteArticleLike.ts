import deleteArticleLike from "@/features/article/like-article/api/deleteArticleLike";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useDeleteArticleLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticleLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export default useDeleteArticleLike;
