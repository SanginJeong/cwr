"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/shared/config/routes";
import { toastKit } from "@/shared/lib/toastKit";

type DemoRole = "hr" | "leader" | "employee";

const ROLES: { role: DemoRole; title: string; description: string }[] = [
  { role: "hr", title: "인사담당자", description: "구성원·근태 정책·회사 전체 휴가" },
  { role: "leader", title: "팀장", description: "팀 근태와 휴가 승인" },
  { role: "employee", title: "직원", description: "출퇴근과 휴가 신청" },
];

/**
 * 원클릭 데모 로그인 (roadmap H6). 비밀번호 없이 역할을 골라 들어간다.
 * 서버(/api/demo-login)가 데모 계정으로 로그인해 세션 쿠키만 넘긴다. 데모 데이터는 매일 새벽 되돌아간다
 */
const DemoLoginSection = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { error } = toastKit();
  const [pendingRole, setPendingRole] = useState<DemoRole | null>(null);

  const login = async (role: DemoRole) => {
    setPendingRole(role);
    try {
      const res = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message ?? "데모 로그인에 실패했습니다.");
      }
      // 다른 계정의 캐시가 남지 않게 비우고, 서버 컴포넌트도 새 세션으로 다시 그린다
      queryClient.clear();
      router.replace(ROUTES.attendance);
      router.refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "데모 로그인에 실패했습니다.");
      setPendingRole(null);
    }
  };

  return (
    <section aria-labelledby="demo-login-title" className="w-full flex flex-col gap-3 mt-8">
      <div className="flex items-center gap-3 text-text-default">
        <hr className="flex-1 border-border-primary" />
        <h2 id="demo-login-title" className="text-md-medium">
          계정 없이 둘러보기
        </h2>
        <hr className="flex-1 border-border-primary" />
      </div>
      <div className="grid grid-cols-1 tablet:grid-cols-3 gap-2">
        {ROLES.map(({ role, title, description }) => (
          <button
            key={role}
            type="button"
            disabled={pendingRole !== null}
            onClick={() => login(role)}
            className="min-h-[64px] rounded-xl border border-border-secondary px-3 py-2.5 text-left tablet:text-center flex flex-col gap-0.5 hover:border-brand-primary hover:bg-brand-primary/10 disabled:opacity-50"
          >
            <span className="text-lg-semibold text-text-primary">
              {pendingRole === role ? "들어가는 중..." : `${title}로 보기`}
            </span>
            <span className="text-xs-regular text-text-default">{description}</span>
          </button>
        ))}
      </div>
      <p className="text-xs-regular text-text-disabled text-center">데모 데이터는 매일 새벽 처음 상태로 돌아가요.</p>
    </section>
  );
};

export default DemoLoginSection;
