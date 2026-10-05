import useDeleteMember from "../api/useDeleteMember";
import { BaseButton } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Modal } from "@/shared/ui/modal";
import { useCheckAdmin } from "@/entities/user";
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
  const isAdmin = useCheckAdmin();

  if (!member) {
    return null;
  }

  const handleDeleteClick = () => {
    if (!isAdmin) {
      error("관리자만 이용 가능합니다.");
      return;
    }

    if (member.role === "ADMIN") {
      error("관리자는 내보낼 수 없습니다.");
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
        <h3 className="text-text-primary text-lg-bold">정말로 삭제하시겠습니까?</h3>
      </Modal.Body>
      <Modal.Footer>
        <BaseButton onClick={onClose} variant="outlinedSecondary" size="large">
          닫기
        </BaseButton>
        <BaseButton onClick={handleDeleteClick} variant="solid" size="large" danger disabled={isPending}>
          {isPending ? "삭제 중..." : "삭제하기"}
        </BaseButton>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteMemberModal;
