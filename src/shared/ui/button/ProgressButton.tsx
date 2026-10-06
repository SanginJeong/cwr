import { Icon } from "@/shared/ui/icon";
import { PROGRESS_BUTTON_BASE_STYLE } from "./BUTTON_STYLES";
import { cn } from "@/shared/lib/cn";

/**
 * @author sangin
 * @component
 * @example
 *
 * // 기본
 * <ProgressButton text="할 일"/>
 *
 * // 커스텀
 * <ProgressButton text="할 일" className={}/>
 *
 * // onClick
 * <ProgressButton text="할 일" className={} onClick={}/>
 */

interface ProgressButtonProps {
  text?: string;
  className?: string;
  onClick?: () => void;
}

// 칸 제목 막대. 동작은 "할 일" 칸의 ＋(목록 추가)뿐이라 막대 자체는 버튼이 아니다.
// 예전에는 막대가 <button>이고 ＋는 onClick이 걸린 <span>이라 키보드로 누를 수 없었다.
const ProgressButton = ({ text, className, onClick }: ProgressButtonProps) => {
  return (
    <div className={cn(PROGRESS_BUTTON_BASE_STYLE, className)}>
      <span>{text}</span>
      {text === "할 일" && onClick && (
        <button type="button" aria-label="할 일 목록 추가" onClick={onClick} className="rounded-lg">
          <Icon name="plus" className="bg-background-primary rounded-lg text-state-400 cursor-pointer" />
        </button>
      )}
    </div>
  );
};

export default ProgressButton;
