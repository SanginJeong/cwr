import useDeleteMember from "../api/useDeleteMember";
import { BaseButton } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Modal } from "@/shared/ui/modal";
import { useIsHrAdmin } from "@/entities/user";
import { GroupMember } from "@/shared/api/types/GroupData";
import { toastKit } from "@/shared/lib/toastKit";
import { useParams } from "next/navigation";

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: GroupMember | null;
}

const DeleteMemberModal = ({ isOpen, onClose, member }: DeleteMemberModalProps) => {
  const { mutate: deleteMember, isPending } = useDeleteMember();
  const { teamId } = useParams();

  const { error } = toastKit();
  const isHrAdmin = useIsHrAdmin();

  if (!member) {
    return null;
  }

  const handleDeleteClick = () => {
    if (!isHrAdmin) {
      error("인사담당자만 이용 가능합니다.");
      return;
    }

    deleteMember(
      { id: Number(teamId), memberUserId: member.userId },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Body className="flex-col-center gap-3">
        <Icon name="alert" className="text-status-danger" />
        <h3 className="text-text-primary text-lg-bold">{member.userName}님을 팀에서 제외할까요?</h3>
      </Modal.Body>
      <Modal.Footer>
        <BaseButton onClick={onClose} variant="outlinedSecondary" size="large">
          닫기
        </BaseButton>
        <BaseButton onClick={handleDeleteClick} variant="solid" size="large" danger disabled={isPending}>
          {isPending ? "제외 중..." : "제외하기"}
        </BaseButton>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteMemberModal;
