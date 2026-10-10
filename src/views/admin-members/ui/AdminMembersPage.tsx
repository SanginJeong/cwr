"use client";

import { useState } from "react";
import {
  STATUS_LABEL,
  evaluateAttendance,
  getMemberToday,
  summarizeAttendance,
  type AttendanceRange,
  type AttendanceStatus,
  type PolicyInfo,
} from "@/entities/attendance";
import { useAdminEmployees, useAdminPolicies, type Employee as EmployeeBase } from "@/entities/employee";
import { useGetVisibleTeams } from "@/entities/team";
import { useGetUser } from "@/entities/user";
import { EditEmployeeModal } from "@/features/employee/edit";
import { RegisterEmployeeModal } from "@/features/employee/register";
import { useSetEmployeeActive } from "@/features/employee/set-active";
import { cn } from "@/shared/lib/cn";
import { monthRange, toMonthKey } from "@/shared/lib/calendar";
import { toKstDateString } from "@/shared/lib/kstDate";
import { BaseButton } from "@/shared/ui/button";
import { Dropdown } from "@/shared/ui/dropdown";
import { Icon } from "@/shared/ui/icon";
import { Modal } from "@/shared/ui/modal";
import { PageLayout } from "@/shared/ui/page-layout";
import FilterSelect from "./_internal/FilterSelect";

const TODAY_CHIP: Record<string, { label: string; className: string }> = {
  ON_TIME: { label: "정상", className: "bg-brand-primary/20 text-icon-brand" },
  LATE: { label: "지각", className: "bg-point-orange/20 text-point-orange" },
  LEAVE: { label: "휴가", className: "bg-point-purple/20 text-point-purple" },
  NOT_YET: { label: "미출근", className: "bg-text-default/15 text-text-default" },
  INACTIVE: { label: "퇴사", className: "bg-text-default/10 text-text-disabled" },
};

/** admin_employees 응답의 한 사람: 프로필 + 근태(엔진 입력) */
type Employee = EmployeeBase<Omit<AttendanceRange, "today" | "userId" | "hiredOn">>;

const SUMMARY_BADGE = "rounded-lg px-3 py-[1px] text-xs-semibold";

/**
 * 구성원 관리 (/admin/members). 인사담당자 전용 (proxy + admin_employees).
 * 이번 달·오늘 근태는 정책 엔진으로 계산한다.
 */
const AdminMembersPage = () => {
  const { from, to } = monthRange(toMonthKey(toKstDateString(new Date())));
  const { data, isPending, isError } = useAdminEmployees<Omit<AttendanceRange, "today" | "userId" | "hiredOn">>({
    from,
    to,
  });
  const { data: policies = [] } = useAdminPolicies<PolicyInfo>();
  const { data: teams = [] } = useGetVisibleTeams();
  const { data: me } = useGetUser();
  const { mutate: setActive, isPending: isSettingActive } = useSetEmployeeActive();

  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [policyFilter, setPolicyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [confirming, setConfirming] = useState<Employee | null>(null);

  const employees = data?.employees ?? [];
  const today = data?.today ?? toKstDateString(new Date());
  const activeCount = employees.filter((e) => e.isActive).length;

  const filtered = employees.filter((e) => {
    const q = query.trim().toLowerCase();
    if (q && !e.nickname.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false;
    if (teamFilter === "none" && e.memberships.length > 0) return false;
    if (teamFilter !== "all" && teamFilter !== "none" && !e.memberships.some((m) => m.groupId === Number(teamFilter)))
      return false;
    if (policyFilter !== "all" && e.policy.id !== Number(policyFilter)) return false;
    if (statusFilter === "active" && !e.isActive) return false;
    if (statusFilter === "inactive" && e.isActive) return false;
    return true;
  });

  const monthText = (employee: Employee) => {
    const summary = summarizeAttendance(evaluateAttendance(employee, from, to, today));
    const parts = (Object.keys(summary) as AttendanceStatus[])
      .filter((status) => summary[status] > 0)
      .map((status) => `${STATUS_LABEL[status]} ${summary[status]}`);
    return parts.length ? parts.join(" · ") : "기록 없음";
  };

  return (
    <PageLayout ariaLabel="구성원 관리">
      <div className="w-full max-w-[1180px] flex flex-col gap-6 pb-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl-bold tablet:text-[28px] text-text-primary">구성원 관리</h1>
            {data && (
              <ul aria-label="구성원 요약" className="flex flex-wrap gap-1.5">
                <li className={cn(SUMMARY_BADGE, "bg-brand-primary text-text-inverse")}>재직 {activeCount}명</li>
                <li className={cn(SUMMARY_BADGE, "bg-interaction-inactive text-text-inverse")}>
                  퇴사 {employees.length - activeCount}명
                </li>
                <li className={cn(SUMMARY_BADGE, "bg-point-purple text-text-inverse")}>팀 {teams.length}개</li>
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="h-9 px-[18px] rounded-xl bg-brand-primary text-lg-semibold text-text-inverse hover:bg-interaction-hover flex items-center gap-1"
          >
            <Icon name="plus" className="size-4 tablet:size-4" />
            직원 추가
          </button>
        </header>

        <div className="flex flex-wrap gap-2">
          <label htmlFor="member-search" className="sr-only">
            이름 및 이메일 검색
          </label>
          <input
            id="member-search"
            type="search"
            placeholder="이름·이메일 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 basis-[220px] h-11 rounded-xl border border-border-primary bg-background-primary px-3.5 text-md-regular text-text-primary placeholder:text-text-default"
          />
          <FilterSelect
            label="팀"
            value={teamFilter}
            onChange={setTeamFilter}
            options={[
              { label: "팀 전체", value: "all" },
              ...teams.map((t) => ({ label: t.name, value: String(t.id) })),
              { label: "소속 없음", value: "none" },
            ]}
          />
          <FilterSelect
            label="근태 정책"
            value={policyFilter}
            onChange={setPolicyFilter}
            options={[
              { label: "정책 전체", value: "all" },
              ...policies.map((p) => ({ label: p.name, value: String(p.id) })),
            ]}
          />
          <FilterSelect
            label="재직 상태"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            options={[
              { label: "재직 중", value: "active" },
              { label: "퇴사", value: "inactive" },
              { label: "전체", value: "all" },
            ]}
          />
        </div>

        {isError ? (
          <p className="rounded-[20px] bg-background-primary px-6 py-12 text-center text-text-default">
            구성원 목록을 불러오지 못했어요.
          </p>
        ) : isPending ? (
          <div aria-busy="true" className="h-[420px] rounded-[20px] bg-background-primary animate-pulse" />
        ) : (
          <section aria-label="구성원 목록" className="rounded-[20px] bg-background-primary overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-md-regular">
              <thead>
                <tr className="text-left text-sm-medium text-text-default">
                  <th className="px-5 py-4 font-medium">이름</th>
                  <th className="px-3 py-4 font-medium">팀 · 역할</th>
                  <th className="px-3 py-4 font-medium">근태 정책</th>
                  <th className="px-3 py-4 font-medium">이번 달</th>
                  <th className="px-3 py-4 font-medium">오늘</th>
                  <th className="px-5 py-4">
                    <span className="sr-only">메뉴</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((employee) => {
                  const todayKind = employee.isActive ? getMemberToday(employee, today).kind : "INACTIVE";
                  const chip = todayKind ? TODAY_CHIP[todayKind] : null;
                  return (
                    <tr
                      key={employee.userId}
                      className={cn("border-t border-border-primary", !employee.isActive && "opacity-60")}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 text-md-semibold text-text-primary">
                            {employee.nickname}
                            {employee.companyRole === "HR_ADMIN" && (
                              <span className="rounded px-1.5 text-xs-medium bg-brand-secondary text-icon-brand">
                                인사담당자
                              </span>
                            )}
                          </span>
                          <span className="text-xs-regular text-text-default">{employee.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-text-secondary">
                        {employee.memberships.length === 0
                          ? "소속 없음"
                          : employee.memberships
                              .map((m) => `${m.groupName} · ${m.role === "ADMIN" ? "팀장" : "직원"}`)
                              .join(", ")}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-lg bg-background-secondary px-2 py-1 text-xs-regular text-text-secondary">
                          {employee.policyId === null ? `기본 · ${employee.policy.name}` : employee.policy.name}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-sm-medium text-text-default">
                        {employee.isActive ? monthText(employee) : "퇴사"}
                      </td>
                      <td className="px-3 py-3.5">
                        {chip && (
                          <span className={cn("rounded-lg px-2 py-0.5 text-xs-semibold", chip.className)}>
                            {chip.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Dropdown
                          label={`${employee.nickname} 메뉴`}
                          iconName="kebab"
                          iconClassName="size-4 tablet:size-4"
                          placement="bottom-right"
                          options={[
                            { label: "정보 수정", action: () => setEditing(employee) },
                            ...(employee.userId === me?.id
                              ? []
                              : [
                                  employee.isActive
                                    ? { label: "퇴사 처리", action: () => setConfirming(employee) }
                                    : {
                                        label: "복직",
                                        action: () => setActive({ userId: employee.userId, isActive: true }),
                                      },
                                ]),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-text-default">
                      조건에 맞는 구성원이 없어요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </div>

      <RegisterEmployeeModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        teams={teams}
        policies={policies}
      />
      {editing && (
        <EditEmployeeModal
          // 목록이 새로 오면 최신 값으로 다시 연다 (팀 배정은 바로 반영되므로)
          employee={employees.find((e) => e.userId === editing.userId) ?? editing}
          onClose={() => setEditing(null)}
          teams={teams}
          policies={policies}
          isMe={editing.userId === me?.id}
        />
      )}
      <Modal isOpen={confirming !== null} onClose={() => setConfirming(null)}>
        <Modal.Body className="flex-col-center gap-3 text-center">
          <Icon name="alert" className="text-status-danger" />
          <h2 className="text-lg-bold text-text-primary">{confirming?.nickname}님을 퇴사 처리할까요?</h2>
          <p className="text-md-regular text-text-default">
            로그인이 차단되고 팀 멤버 목록과 근태 판정에서 빠져요. 기록은 남고, 복직하면 원래 팀으로 돌아와요.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <BaseButton variant="outlinedSecondary" size="large" onClick={() => setConfirming(null)}>
            취소
          </BaseButton>
          <BaseButton
            variant="solid"
            size="large"
            danger
            disabled={isSettingActive}
            onClick={() =>
              confirming &&
              setActive({ userId: confirming.userId, isActive: false }, { onSettled: () => setConfirming(null) })
            }
          >
            퇴사 처리
          </BaseButton>
        </Modal.Footer>
      </Modal>
    </PageLayout>
  );
};

export default AdminMembersPage;
