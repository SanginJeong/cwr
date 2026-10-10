"use client";

import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import useDropdownClose from "@/shared/lib/useDropdownClose";
import { Icon } from "@/shared/ui/icon";

interface FilterSelectProps {
  /** 접근 가능한 이름 (예: "팀"). 화면 읽기와 E2E 셀렉터가 쓴다 */
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

/** 목록 필터용 드롭다운. 메뉴는 프로필 메뉴의 "내 상태" 하위 메뉴와 같은 모양(선택 항목에 체크) */
const FilterSelect = ({ label, value, options, onChange }: FilterSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  useDropdownClose(ref, () => setIsOpen(false), isOpen);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-11 min-w-[128px] flex items-center gap-2 rounded-xl border border-border-primary bg-background-primary px-3 text-md-regular text-text-secondary"
      >
        <span className="flex-1 text-center whitespace-nowrap">{selectedLabel}</span>
        <Icon
          name="downArrow"
          className={cn(
            "size-4 tablet:size-4 shrink-0 text-icon-primary transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-full z-[20] mt-1 min-w-full whitespace-nowrap bg-background-primary border rounded-xl shadow-md py-1"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-state-200 transition"
                >
                  <span className="flex-1 text-md-regular text-text-primary">{option.label}</span>
                  <Icon
                    name="check"
                    className={cn("size-4 tablet:size-4 text-brand-primary", !isSelected && "invisible")}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FilterSelect;
