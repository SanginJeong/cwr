"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useGetGroups } from "@/entities/team";
import { useGetUser } from "@/entities/user";
import { cn } from "@/shared/lib/cn";
import { FloatingButton } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Profile } from "@/shared/ui/profile";
import { buildMockMessages } from "./_internal/mockMessages";

/**
 * 팀 채팅 (목업). 화면 오른쪽 아래 버튼으로 연다.
 * 메시지 저장·실시간 전송은 아직 구현하지 않았다. 예시 메시지만 보여주고 입력은 막아 둔다.
 * 구현 계획은 docs/roadmap.md의 "팀 채팅".
 */
const TeamChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { teamId } = useParams();
  const { data: group } = useGetGroups({ id: Number(teamId) });
  const { data: me } = useGetUser();

  if (!group) return null;

  const messages = buildMockMessages(group.members);

  return (
    <div className="fixed right-3 bottom-3 z-40">
      <FloatingButton
        iconName={isOpen ? "x" : "comment"}
        ariaLabel={isOpen ? "팀 채팅 닫기" : "팀 채팅 열기"}
        ariaExpanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      />

      {isOpen && (
        <section
          aria-label={`${group.name} 팀 채팅 (준비 중)`}
          className={cn(
            "absolute bottom-[65px] right-0 flex flex-col overflow-hidden",
            "w-[calc(100vw-24px)] h-[min(480px,calc(100vh-120px))] tablet:w-[360px]",
            "rounded-[20px] border border-border-primary bg-background-primary shadow-xl",
          )}
        >
          <header className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
            <div className="flex flex-col">
              <h2 className="text-lg-semibold text-text-primary truncate">{group.name}</h2>
              <span className="text-xs-regular text-text-default">팀원 {group.members.length}명</span>
            </div>
            <span className="rounded-full px-2.5 py-1 text-xs-medium bg-brand-secondary text-icon-brand">준비 중</span>
          </header>

          <p className="mx-4 mt-3 rounded-lg bg-background-secondary px-3 py-2 text-xs-regular text-text-default">
            팀 채팅은 준비 중이에요. 아래는 미리보기 예시입니다.
          </p>

          <ol className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4" aria-label="예시 메시지">
            {messages.map(({ id, member, content, time }) => {
              const isMine = member.userId === me?.id;
              return (
                <li
                  key={id}
                  className={cn("flex gap-2 max-w-[85%]", isMine ? "self-end flex-row-reverse" : "self-start")}
                >
                  {!isMine && <Profile src={member.userImage || null} alt={`${member.userName}의 프로필`} size="sm" />}
                  <div className={cn("flex flex-col gap-1", isMine && "items-end")}>
                    {!isMine && <span className="text-xs-medium text-text-secondary">{member.userName}</span>}
                    <div className={cn("flex items-end gap-1.5", isMine && "flex-row-reverse")}>
                      <p
                        className={cn(
                          "rounded-2xl px-3 py-2 text-md-regular break-words",
                          isMine
                            ? "bg-brand-primary text-text-inverse rounded-tr-sm"
                            : "bg-background-tertiary text-text-primary rounded-tl-sm",
                        )}
                      >
                        {content}
                      </p>
                      <time className="shrink-0 text-xs-regular text-text-disabled">{time}</time>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <form
            className="flex items-center gap-2 border-t border-border-primary p-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              disabled
              placeholder="채팅은 준비 중이에요"
              aria-label="메시지 입력 (준비 중)"
              className="flex-1 h-10 rounded-xl bg-background-secondary px-3 text-md-regular text-text-primary placeholder:text-text-disabled disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled
              aria-label="보내기 (준비 중)"
              className="size-10 rounded-xl bg-brand-primary/40 flex-center cursor-not-allowed"
            >
              <Icon name="upArrow" className="size-5 tablet:size-5 text-text-inverse" />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default TeamChatWidget;
