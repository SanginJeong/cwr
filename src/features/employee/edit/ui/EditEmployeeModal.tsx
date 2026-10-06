"use client";

import { useState } from "react";
import type { PolicyInfo } from "@/entities/attendance";
import type { AdminPolicy, EmployeeProfile } from "@/entities/employee";
import type { TeamSummary } from "@/shared/api/types/groupApi";
import type { CompanyRole, UserRole } from "@/shared/api/types/UserType";
import { BaseButton } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { useChangeMembership, useUpdateEmployee } from "../api/useEditEmployee";

interface EditEmployeeModalProps {
  employee: EmployeeProfile;
  onClose: () => void;
  teams: TeamSummary[];
  policies: AdminPolicy<PolicyInfo>[];
  /** 본인이면 회사 역할을 바꿀 수 없다 */
  isMe: boolean;
}

const SELECT_STYLE =
  "h-11 w-full rounded-xl border border-border-primary bg-background-secondary px-3 text-md-regular text-text-primary";

/**
 * 정보 수정: 이름·입사일·회사 역할·정책은 저장 버튼으로, 팀 배정은 바로 반영한다.
 * 입사일을 바꾸면 그 전 날짜는 판정하지 않는다 (ADR-007)
 */
const EditEmployeeModal = ({ employee, onClose, teams, policies, isMe }: EditEmployeeModalProps) => {
  const [nickname, setNickname] = useState(employee.nickname);
  const [hiredOn, setHiredOn] = useState(employee.hiredOn);
  const [companyRole, setCompanyRole] = useState<CompanyRole>(employee.companyRole);
  const [policyId, setPolicyId] = useState(employee.policyId?.toString() ?? "");
  const [newTeamId, setNewTeamId] = useState("");
  const [newTeamRole, setNewTeamRole] = useState<UserRole>("MEMBER");

  const { mutate: update, isPending } = useUpdateEmployee();
  const { mutate: changeMembership, isPending: isChangingTeam } = useChangeMembership();

  const assignedIds = new Set(employee.memberships.map((m) => m.groupId));
  const availableTeams = teams.filter((t) => !assignedIds.has(t.id));
  const defaultPolicy = policies.find((p) => p.isDefault);

  const save = () => {
    const nextPolicyId = policyId ? Number(policyId) : null;
    update(
      {
        userId: employee.userId,
        nickname: nickname.trim(),
        hiredOn,
        companyRole,
        policyId: nextPolicyId === employee.policyId ? undefined : nextPolicyId,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="gap-4 pt-8 pb-6 px-6 max-h-[92vh] overflow-y-auto items-stretch tablet:w-[440px]"
    >
      <Modal.CloseIcon onClose={onClose} />
      <div className="text-center">
        <h2 className="text-2lg-semibold text-text-primary">정보 수정</h2>
        <p className="text-sm-medium text-text-default break-all">{employee.email}</p>
      </div>

      <Input label="이름" value={nickname} maxLength={30} onChange={(e) => setNickname(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="입사일" type="date" value={hiredOn} onChange={(e) => setHiredOn(e.target.value)} />
        <label className="flex flex-col gap-2 text-md-medium text-text-primary">
          회사 역할
          <select
            className={SELECT_STYLE}
            value={companyRole}
            disabled={isMe}
            title={isMe ? "본인의 인사담당자 역할은 내려놓을 수 없어요" : undefined}
            onChange={(e) => setCompanyRole(e.target.value as CompanyRole)}
          >
            <option value="EMPLOYEE">직원</option>
            <option value="HR_ADMIN">인사담당자</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2 text-md-medium text-text-primary">
        근태 정책
        <select className={SELECT_STYLE} value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
          <option value="">기본 정책{defaultPolicy ? ` (${defaultPolicy.name})` : ""}</option>
          {policies
            .filter((p) => !p.isDefault)
            .map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name}
              </option>
            ))}
        </select>
      </label>

      <BaseButton variant="solid" size="large" onClick={save} disabled={isPending || !nickname.trim() || !hiredOn}>
        {isPending ? "저장 중..." : "저장하기"}
      </BaseButton>

      <section aria-labelledby="edit-teams-title" className="flex flex-col gap-2.5 border-t border-border-primary pt-4">
        <h3 id="edit-teams-title" className="text-lg-semibold text-text-primary">
          팀 배정 <span className="text-sm-medium text-text-default">바로 반영돼요</span>
        </h3>
        {employee.memberships.length === 0 && (
          <p className="text-sm-medium text-text-default">아직 배정된 팀이 없어요.</p>
        )}
        <ul className="flex flex-col gap-2">
          {employee.memberships.map((m) => (
            <li key={m.groupId} className="flex items-center gap-2 rounded-xl bg-background-secondary px-3 py-2">
              <span className="flex-1 min-w-0 truncate text-md-medium text-text-primary">{m.groupName}</span>
              <select
                aria-label={`${m.groupName} 역할`}
                className="h-9 rounded-lg border border-border-primary bg-background-primary px-2 text-sm-medium text-text-primary"
                value={m.role}
                disabled={isChangingTeam}
                onChange={(e) =>
                  changeMembership({
                    type: "role",
                    userId: employee.userId,
                    groupId: m.groupId,
                    role: e.target.value as UserRole,
                  })
                }
              >
                <option value="MEMBER">직원</option>
                <option value="ADMIN">팀장</option>
              </select>
              <button
                type="button"
                disabled={isChangingTeam}
                onClick={() => changeMembership({ type: "remove", userId: employee.userId, groupId: m.groupId })}
                className="h-9 px-2.5 rounded-lg text-sm-medium text-status-danger hover:bg-background-tertiary disabled:opacity-50"
              >
                해제
              </button>
            </li>
          ))}
        </ul>
        {employee.isActive && availableTeams.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              aria-label="배정할 팀"
              className="flex-1 h-10 rounded-lg border border-border-primary bg-background-secondary px-2 text-sm-medium text-text-primary"
              value={newTeamId}
              onChange={(e) => setNewTeamId(e.target.value)}
            >
              <option value="">팀 선택</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              aria-label="팀 역할"
              className="h-10 rounded-lg border border-border-primary bg-background-secondary px-2 text-sm-medium text-text-primary"
              value={newTeamRole}
              onChange={(e) => setNewTeamRole(e.target.value as UserRole)}
            >
              <option value="MEMBER">직원</option>
              <option value="ADMIN">팀장</option>
            </select>
            <button
              type="button"
              disabled={!newTeamId || isChangingTeam}
              onClick={() =>
                changeMembership(
                  { type: "add", userId: employee.userId, groupId: Number(newTeamId), role: newTeamRole },
                  { onSuccess: () => setNewTeamId("") },
                )
              }
              className="h-10 px-3 rounded-lg border border-brand-primary text-sm-semibold text-icon-brand disabled:opacity-40"
            >
              배정
            </button>
          </div>
        )}
      </section>
    </Modal>
  );
};

export default EditEmployeeModal;
