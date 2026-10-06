"use client";

import { useRef, useState } from "react";
import { Icon } from "@/shared/ui/icon";
import { cn } from "@/shared/lib/cn";
import { SelectOption } from "./_types/types";
import useDropdownClose from "@/shared/lib/useDropdownClose";

/**
 * @author sangin
 *
 * @example
 * ```tsx
 * const [order ,setOrder] = useState("recent")
 * const options = [
 *   { label: "최신순", value: "recent" },
 *   { label: "좋아요순", value: "like" },
 * ];
 *
 * <Select
 *   value={order}
 *   onChange={setOrder}
 *   options={options}
 * />
 * ```
 */

interface SelectProps<T> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  textAlign?: "left" | "center";
  /**
   * overlay(기본): 목록이 아래 내용 위에 뜬다.
   * inline: 목록이 문서 흐름 안에 펼쳐져 아래 내용을 밀어낸다. 스크롤되는 모달 안에서 잘리지 않게 할 때.
   */
  menuPlacement?: "overlay" | "inline";
}

const Select = <T,>({
  value,
  options,
  onChange,
  className,
  textAlign = "left",
  menuPlacement = "overlay",
}: SelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = options.find((option) => option.value === value)?.label;

  const handleSelect = (option: SelectOption<T>) => {
    onChange(option.value);
    setIsOpen(false);
  };

  useDropdownClose(selectRef, () => setIsOpen(false), isOpen);

  return (
    <div className="relative inline-block" ref={selectRef}>
      {/* 접근 이름은 보이는 선택값. 폼 안에서도 제출하지 않게 type="button" */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex justify-between items-center min-w-[110px] tablet:min-w-[120px] h-[44px] px-[10px] py-[14px] bg-background-primary border border-border-primary rounded-xl",
          className,
        )}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-text-default text-md-medium">{selectedLabel}</span>
        <span>
          <Icon
            aria-label="화살표"
            name="downArrow"
            className={cn("text-icon-primary transition-transform duration-300", isOpen && "rotate-180")}
          />
        </span>
      </button>

      {isOpen && (
        <ul
          className={cn(
            "mt-1 w-full bg-background-primary border rounded-xl shadow-md",
            menuPlacement === "overlay" && "absolute left-0 top-full",
          )}
        >
          {options.map((option) => (
            <li key={option.label}>
              <button
                type="button"
                aria-current={option.value === value || undefined}
                className={cn("w-full px-3 py-2 hover:bg-state-200 transition", `text-${textAlign}`)}
                onClick={() => handleSelect(option)}
              >
                <span className="text-md-regular text-text-primary">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Select;
