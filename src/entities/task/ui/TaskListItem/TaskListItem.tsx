"use client";

import { Dropdown } from "@/shared/ui/dropdown";
import { Icon } from "@/shared/ui/icon";
import Todo from "../Todo/Todo";
import type { TaskListItemType } from "@/shared/api/types/TaskListItemType";
import { cn } from "@/shared/lib/cn";
import { formatToKoreanDate } from "@/shared/lib/formatDate";
import { getFrequencyLabel } from "../../lib/getFrequencyLabel";
import { MyHistoryItem } from "@/shared/api/types/userApi";

interface TaskListItemProps {
  item: TaskListItemType | MyHistoryItem;
  onOpenDetail?: () => void;
  onToggleTodo?: (id: number, next: boolean) => void;
  options?: Array<{ label: string; action: () => void }>;
}

/**
 * 할 일 한 줄. onOpenDetail이 있으면 카드 어디를 눌러도 상세가 열린다.
 * 예전에는 li 자체를 버튼(role="button")으로 만들어 그 안에 체크박스·메뉴 버튼이 들어 있었다
 * (버튼 안의 버튼이라 화면 낭독기가 읽지 못하고, 목록의 항목도 아니게 됐다).
 * 지금은 카드를 덮는 "상세보기" 버튼을 깔고, 체크박스와 메뉴를 그 위(z-10)에 둔다.
 */
const TaskListItem = ({ item, onOpenDetail, onToggleTodo, options }: TaskListItemProps) => {
  return (
    <li
      className={cn(
        "relative flex flex-col items-start rounded-lg gap-[10px] border transition-colors",
        item.doneAt === null
          ? "border-border-primary bg-background-primary"
          : "border-background-secondary bg-background-secondary",
      )}
      style={{ padding: "12px 14px" }}
    >
      {onOpenDetail && (
        <button
          type="button"
          aria-label={`${item.name} 상세보기`}
          onClick={onOpenDetail}
          className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-interaction-focus"
        />
      )}
      <div className="w-full flex items-center justify-between">
        <div className="relative z-10 flex items-center gap-3">
          <Todo
            title={item.name}
            id={item.id}
            completed={item.doneAt !== null}
            type="task"
            onChangeCompleted={(_, next) => {
              onToggleTodo?.(item.id, next);
            }}
          />
          {"commentCount" in item && (
            <div className="flex items-center gap-[2px] text-xs-regular">
              <Icon name="comment" className="size-4 tablet:size-4" />
              <span>{item.commentCount}</span>
            </div>
          )}
        </div>
        {options && (
          <div className="relative z-10">
            <Dropdown
              label={`${item.name} 메뉴`}
              iconName="kebab"
              options={options}
              iconClassName="size-4 tablet:size-4"
              placement="bottom-right"
            />
          </div>
        )}
      </div>
      <div className="h-[14px] flex items-center gap-2 text-xs-regular text-text-default">
        <time dateTime={item?.date} className="flex items-center gap-[6px]">
          <Icon name="calendar" className="size-4 tablet:size-4" />
          <span>{formatToKoreanDate(item?.date)}</span>
        </time>
        <hr aria-hidden="true" className="w-[1px] h-full bg-slate-700" />
        <div className="flex items-center gap-[6px]">
          <Icon name="repeat" className="size-4 tablet:size-4" />
          <span>{getFrequencyLabel(item?.frequency)}</span>
        </div>
      </div>
    </li>
  );
};

export default TaskListItem;
