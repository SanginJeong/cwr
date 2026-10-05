import BaseButton from "@/shared/ui/button/BaseButton";
import Input from "@/shared/ui/input/Input";
import Modal from "@/shared/ui/modal/Modal";
import usePostTaskList from "@/features/task-list/manage-task-list/api/usePostTaskList";
import { useParams } from "next/navigation";
import { ChangeEvent, useState } from "react";

interface CreateTaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTaskListModal = ({ isOpen, onClose }: CreateTaskListModalProps) => {
  const [taskValue, setTaskValue] = useState("");

  const { mutate: postTaskList, isPending } = usePostTaskList();
  const { teamId } = useParams();

  const isDisabledCreateButton = isPending || !taskValue.trim();

  const handleCreateTaskClick = () => {
    postTaskList(
      { groupId: Number(teamId), name: taskValue },
      {
        onSuccess: () => {
          onClose();
          setTaskValue("");
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.CloseIcon onClose={onClose} />
      <Modal.Body className="flex-col-center gap-2">
        <h3>할 일 목록</h3>
        <Input
          value={taskValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskValue(e.target.value)}
          placeholder="목록 명을 입력해주세요."
        />
      </Modal.Body>
      <Modal.Footer>
        <BaseButton variant="solid" size="large" onClick={handleCreateTaskClick} disabled={isDisabledCreateButton}>
          {isPending ? "만드는 중..." : "만들기"}
        </BaseButton>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateTaskListModal;
