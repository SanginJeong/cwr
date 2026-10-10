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

const MENU_CLASS = "min-w-[120px] bg-background-primary border rounded-xl shadow-md";

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
  // 열려 있는 하위 메뉴의 부모 라벨
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  // 메뉴가 화면 왼쪽에 붙어 있으면 하위 메뉴는 오른쪽으로, 오른쪽에 붙어 있으면 왼쪽으로 연다
  const submenuSide = placement.endsWith("left") ? "right" : "left";
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
    setOpenSubmenu(null);
  };

  const close = () => {
    setIsOpen(false);
    setOpenSubmenu(null);
  };

  const handleOptionClick = (option: DropdownOption) => {
    if (option.children) {
      // 터치에서는 탭할 때 mouseenter가 먼저 와서 이미 열려 있다. 토글하면 바로 닫히므로 열기만 한다
      setOpenSubmenu(option.label);
      return;
    }
    option.action?.();
    close();
  };

  useDropdownClose(dropdownRef, close, isOpen);

  const renderOption = (option: DropdownOption) => (
    <button
      className={cn(
        "w-full px-3 py-2 hover:bg-state-200 transition",
        `text-${textAlign}`,
        option.icon && "flex items-center gap-2 text-left",
        // 화살표는 띄워서 라벨 정렬(가운데 등)이 다른 항목과 같게 한다
        option.children && "relative px-6",
      )}
      onClick={() => handleOptionClick(option)}
      aria-current={option.selected || undefined}
      aria-haspopup={option.children ? "menu" : undefined}
      aria-expanded={option.children ? openSubmenu === option.label : undefined}
    >
      {option.icon}
      <span className={cn("text-md-regular text-text-primary", option.icon && "flex-1")}>{option.label}</span>
      {option.selected && <Icon name="check" className="size-4 tablet:size-4 text-brand-primary" />}
      {option.children && (
        <Icon
          name={submenuSide === "right" ? "rightArrow" : "leftArrow"}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 size-3 tablet:size-3 text-text-default",
            submenuSide === "right" ? "right-2" : "left-2",
          )}
        />
      )}
    </button>
  );

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
            className={cn(MENU_CLASS, "z-[999]", PLACEMENT_TRANSFORM[placement])}
          >
            {options.map((option) => (
              <li
                key={option.label}
                className={cn(option.children && "relative")}
                onMouseEnter={() => option.children && setOpenSubmenu(option.label)}
                onMouseLeave={() => option.children && setOpenSubmenu(null)}
              >
                {renderOption(option)}
                {option.children && openSubmenu === option.label && (
                  <ul
                    className={cn(
                      MENU_CLASS,
                      "absolute top-0 whitespace-nowrap",
                      submenuSide === "right" ? "left-full" : "right-full",
                    )}
                  >
                    {option.children.map((child) => (
                      <li key={child.label}>{renderOption(child)}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Portal>
      )}
    </>
  );
};

export default Dropdown;
