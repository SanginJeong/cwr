"use client";

import { useState } from "react";
import { type PolicyInfo } from "@/entities/attendance";
import { useAdminPolicies } from "@/entities/employee";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";
import { PageLayout } from "@/shared/ui/page-layout";
import PolicyEditor from "./PolicyEditor";

/** 근태 정책 (/admin/policies). 인사담당자 전용. 정책은 데이터로 저장하고 판정은 엔진이 한다 (ADR-007) */
const AdminPoliciesPage = () => {
  const { data: policies = [], isPending, isError } = useAdminPolicies<PolicyInfo>();
  // null = 새 정책, undefined = 아직 고르지 않음 (첫 정책)
  const [selectedId, setSelectedId] = useState<number | null | undefined>(undefined);

  const selected = selectedId === null ? null : (policies.find((p) => p.id === selectedId) ?? policies[0] ?? null);

  return (
    <PageLayout ariaLabel="근태 정책">
      <div className="w-full max-w-[1180px] flex flex-col gap-6 pb-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl-bold tablet:text-[28px] text-text-primary">근태 정책</h1>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="h-11 px-[18px] rounded-xl border border-brand-primary text-lg-semibold text-icon-brand hover:bg-brand-primary/10 flex items-center gap-1"
          >
            <Icon name="plus" className="size-4 tablet:size-4" />새 정책
          </button>
        </header>

        {isError ? (
          <p className="rounded-[20px] bg-background-primary px-6 py-12 text-center text-text-default">
            근태 정책을 불러오지 못했어요.
          </p>
        ) : isPending ? (
          <div aria-busy="true" className="h-[480px] rounded-[20px] bg-background-primary animate-pulse" />
        ) : (
          <div className="flex flex-col pc:flex-row gap-6 items-stretch pc:items-start">
            <ul aria-label="정책 목록" className="w-full pc:w-[320px] shrink-0 flex flex-col gap-3">
              {policies.map((policy) => {
                const isSelected = selected?.id === policy.id;
                return (
                  <li key={policy.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(policy.id)}
                      className={cn(
                        "w-full text-left rounded-2xl bg-background-primary px-5 py-4 flex flex-col gap-1.5 border",
                        isSelected
                          ? "border-2 border-brand-primary"
                          : "border-border-primary hover:bg-background-tertiary",
                      )}
                    >
                      <span className="w-full flex items-center justify-between gap-2">
                        <span className="text-lg-semibold text-text-primary truncate">
                          {policy.name}
                          {policy.isDefault && (
                            <span className="ml-1.5 align-middle rounded px-1.5 text-xs-medium bg-brand-secondary text-icon-brand">
                              기본
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs-regular text-text-default">{policy.employeeCount}명</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <PolicyEditor
              // 다른 정책을 고르면 폼을 새로 만든다
              key={selected?.id ?? "new"}
              policy={selected}
              onSaved={(id) => setSelectedId(id)}
              onDeleted={() => setSelectedId(undefined)}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminPoliciesPage;
