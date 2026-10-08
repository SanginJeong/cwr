"use client";

import useDropdownClose from "@/shared/lib/useDropdownClose";
import { MouseEvent, ReactNode, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, IconKeys } from "@/shared/ui/icon";
import { DropdownOption } from "./_types/types";
import { Portal } from "@/shared/ui/portal";
import { DropdownPlacement, getPositionByPlacement } from "@/shared/lib/getPositionByPlacement";

const PLACEMENT_TRANSFORM: Record<DropdownPlacement, string> = {
  "bottom-left": "translate-x-0 translate-y-0",
  "top-left": "translate-x-0 -translate-y-full",
  "bottom-right": "-translate-x-full translate-y-0",
  "top-right": "-translate-x-full -translate-y-full",
};

interface DropdownProps {
  /** 트리거 버튼의 접근 가능한 이름 (예: "직원1 메뉴"). 화면 읽기와 E2E 셀렉터가 쓴다 */
  label?: string;
  iconName?: IconKeys;
  image?: ReactNode;
  iconClassName?: string;
  options: DropdownOption[];
  textAlign?: "left" | "center";
  placement?: DropdownPlacement;
}

const Dropdown = ({
  label = "메뉴 열기",
  iconName,
  iconClassName,
  options,
  textAlign = "center",
  image,
  placement = "bottom-left",
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLUListElement | null>(null);

  const handleDropdownClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const pos = getPositionByPlacement(rect, placement);

    setPosition(pos);
    setIsOpen((prev) => !prev);
  };

  const handleOptionClick = (option: DropdownOption) => {
    option.action();
    setIsOpen(false);
  };

  useDropdownClose(dropdownRef, () => setIsOpen(false), isOpen);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleDropdownClick}
      >
        {iconName ? <Icon name={iconName} className={iconClassName} /> : image}
      </button>

      {isOpen && (
        <Portal>
          <ul
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
            }}
            className={cn(
              "min-w-[120px] bg-background-primary border rounded-xl shadow-md z-[999]",
              PLACEMENT_TRANSFORM[placement],
            )}
          >
            {options.map((option) => (
              <li key={option.label}>
                <button
                  className={cn(
                    "w-full px-3 py-2 hover:bg-state-200 transition",
                    `text-${textAlign}`,
                    option.icon && "flex items-center gap-2 text-left",
                  )}
                  onClick={() => handleOptionClick(option)}
                  aria-current={option.selected || undefined}
                >
                  {option.icon}
                  <span className={cn("text-md-regular text-text-primary", option.icon && "flex-1")}>
                    {option.label}
                  </span>
                  {option.selected && <Icon name="check" className="size-4 tablet:size-4 text-brand-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </Portal>
      )}
    </>
  );
};

export default Dropdown;
