"use client";

import { MouseEvent, useEffect } from "react";
import { cn } from "@/shared/lib/cn";
import {
  MODAL_BASE_STYLE,
  MODAL_BODY_STYLE,
  MODAL_CLOSE_ICON_STYLE,
  MODAL_FOOTER_STYLE,
  MODAL_OVERLAY_STYLE,
} from "./MODAL_STYLE";
import { Icon } from "@/shared/ui/icon";
import { ModalProps, ModalContentProps } from "./_types/ModalProps";
import { Portal } from "@/shared/ui/portal";

/**
 * @author sangin
 * CloseIcon: 필요 시 사용
 * Body: 자유롭게 모달 안 내용들 넣기 스토리 참조
 * Footer: 주로 버튼들이 들어갈 영역
 */

const Modal = ({ isOpen, onClose, className, children }: ModalProps) => {
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className={MODAL_OVERLAY_STYLE} onClick={handleOverlayClick}>
        <div role="dialog" aria-modal="true" className={cn(MODAL_BASE_STYLE, className)}>
          {children}
        </div>
      </div>
    </Portal>
  );
};

const ModalCloseIcon = ({ className, onClose }: { className?: string; onClose: () => void }) => {
  // 아이콘이 아니라 버튼 자체를 위치·크기 지정한다 (크기가 0인 버튼은 누를 수 없고 화면 읽기·E2E에서도 잡히지 않는다)
  return (
    <button
      type="button"
      aria-label="닫기"
      onClick={onClose}
      className={cn(MODAL_CLOSE_ICON_STYLE, "size-11", className)}
    >
      <Icon name="x" />
    </button>
  );
};

const ModalBody = ({ children, className }: ModalContentProps) => {
  return <div className={cn(MODAL_BODY_STYLE, className)}>{children}</div>;
};

const ModalFooter = ({ children, className }: ModalContentProps) => {
  return <div className={cn(MODAL_FOOTER_STYLE, className)}>{children}</div>;
};

Modal.CloseIcon = ModalCloseIcon;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
