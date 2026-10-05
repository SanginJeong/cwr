import postArticle from "./postArticle";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";

const usePostArticle = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error } = toastKit();
  return useMutation({
    mutationFn: postArticle,
    onSuccess: (data) => {
      success("게시물 등록을 성공했습니다.");
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      router.replace(ROUTES.article(data.id));
    },
    onError: () => {
      error("게시물을 등록하지 못하였습니다.");
    },
  });
};

export default usePostArticle;
