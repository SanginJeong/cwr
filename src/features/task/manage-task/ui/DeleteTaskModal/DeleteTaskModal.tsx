import { BaseButton } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";

interface DeleteTaskModalProps {
  isOpen: boolean;
  /** 지울 할 일 이름. 어떤 할 일인지 보여준다 */
  taskName: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** 할 일 삭제 확인. 되돌릴 수 없으므로 메뉴에서 바로 지우지 않는다 */
const DeleteTaskModal = ({ isOpen, taskName, onClose, onConfirm }: DeleteTaskModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="flex-col-center gap-4">
      <Modal.Body className="flex-col-center gap-2 text-center">
        <h2 className="text-lg-medium text-text-primary">할 일 삭제를 진행하시겠어요?</h2>
        <p className="text-md-medium text-text-primary break-all">{taskName}</p>
        <p className="text-md-medium text-text-muted">이 작업은 취소할 수 없습니다.</p>
      </Modal.Body>
      <Modal.Footer>
        <BaseButton variant="outlinedSecondary" size="large" onClick={onClose}>
          취소
        </BaseButton>
        <BaseButton variant="solid" size="large" onClick={onConfirm} danger>
          삭제하기
        </BaseButton>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteTaskModal;
