import { FormEvent } from "react";
import useDeleteComment from "@/features/task-comment/manage-comment/api/useDeleteComment";
import usePatchComment from "@/features/task-comment/manage-comment/api/usePatchComment";
import usePostTaskListComment from "@/features/task-comment/manage-comment/api/usePostTaskListComment";

interface Comment {
  commentValue: string;
  setCommentValue: (value: string) => void;
}

interface UseCommentMutationsProps {
  groupId: number;
  taskListId: number;
  taskId: number;
  comment: Comment;
}

const useDetailCommentMutations = ({ groupId, taskListId, taskId, comment }: UseCommentMutationsProps) => {
  const { mutate: postComment, isPending: postCommentPending } = usePostTaskListComment({
    groupId,
    taskListId,
    taskId,
  });

  const trimmedCommentValue = comment.commentValue.trim();
  const handleSubmitComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!trimmedCommentValue) return;

    postComment(trimmedCommentValue, {
      onSuccess: () => {
        comment.setCommentValue("");
      },
    });
  };

  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: updateComment } = usePatchComment();

  const handleUpdateComment = (commentId: number, newContent: string) => {
    updateComment({
      taskId: taskId,
      commentId: commentId,
      content: newContent,
    });
  };

  return {
    postComment,
    postCommentPending,
    deleteComment,
    handleUpdateComment,
    handleSubmitComment,
  };
};

export default useDetailCommentMutations;
