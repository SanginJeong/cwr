"use client";

import { useState } from "react";
import type { PolicyInfo } from "@/entities/attendance";
import type { AdminPolicy } from "@/entities/employee";
import { ApiError } from "@/shared/api/supabase/errors";
import type { TeamSummary } from "@/shared/api/types/groupApi";
import type { CompanyRole, UserRole } from "@/shared/api/types/UserType";
import { toastKit } from "@/shared/lib/toastKit";
import { BaseButton } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import useRegisterEmployee, { type RegisterEmployeeResponse } from "../api/useRegisterEmployee";

interface RegisterEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TeamSummary[];
  policies: AdminPolicy<PolicyInfo>[];
}

const SELECT_STYLE =
  "h-11 w-full rounded-xl border border-border-primary bg-background-secondary px-3 text-md-regular text-text-primary";

const EMPTY = { nickname: "", email: "", groupId: "", teamRole: "MEMBER", policyId: "", companyRole: "EMPLOYEE" };

/**
 * 직원 추가. 계정과 임시 비밀번호를 만들고 팀·정책을 함께 배정한다 (BFF).
 * 임시 비밀번호는 이 화면에서 한 번만 보여준다.
 */
const RegisterEmployeeModal = ({ isOpen, onClose, teams, policies }: RegisterEmployeeModalProps) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<{ nickname?: string; email?: string }>({});
  const [created, setCreated] = useState<RegisterEmployeeResponse | null>(null);
  const { mutate: register, isPending } = useRegisterEmployee();
  const { success, error } = toastKit();

  const set = (key: keyof typeof EMPTY) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const close = () => {
    setForm(EMPTY);
    setErrors({});
    setCreated(null);
    onClose();
  };

  const submit = () => {
    setErrors({});
    register(
      {
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        companyRole: form.companyRole as CompanyRole,
        groupId: form.groupId ? Number(form.groupId) : null,
        teamRole: form.teamRole as UserRole,
        policyId: form.policyId ? Number(form.policyId) : null,
      },
      {
        onSuccess: setCreated,
        onError: (err) => {
          const field = err instanceof ApiError ? err.field : undefined;
          if (field === "nickname" || field === "email") setErrors({ [field]: err.message });
          else error(err.message);
        },
      },
    );
  };

  const copyPassword = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.temporaryPassword);
      success("임시 비밀번호를 복사했어요.");
    } catch {
      error("복사하지 못했어요. 직접 선택해서 복사해주세요.");
    }
  };

  const defaultPolicy = policies.find((p) => p.isDefault);

  return (
    <Modal isOpen={isOpen} onClose={close} className="gap-4 pt-8 pb-6 px-6 max-h-[92vh] overflow-y-auto items-stretch">
      <Modal.CloseIcon onClose={close} />
      {created ? (
        <>
          <h2 className="text-2lg-semibold text-text-primary text-center">{created.nickname}님을 등록했어요</h2>
          <dl className="rounded-2xl bg-background-secondary p-4 flex flex-col gap-3">
            <div>
              <dt className="text-sm-medium text-text-default">로그인 이메일</dt>
              <dd className="text-lg-semibold text-text-primary break-all">{created.email}</dd>
            </div>
            <div>
              <dt className="text-sm-medium text-text-default">임시 비밀번호</dt>
              <dd className="flex items-center justify-between gap-2">
                <code className="text-xl-bold text-icon-brand select-all">{created.temporaryPassword}</code>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="h-8 px-3 rounded-lg border border-border-secondary text-sm-semibold text-text-secondary"
                >
                  복사
                </button>
              </dd>
            </div>
          </dl>
          <p className="text-sm-medium text-point-yellow">
            임시 비밀번호는 지금 한 번만 보여줘요. 직원에게 전달하고, 첫 로그인 뒤 계정 설정에서 바꾸게 해주세요.
          </p>
          <BaseButton variant="solid" size="large" onClick={close}>
            확인
          </BaseButton>
        </>
      ) : (
        <>
          <h2 className="text-2lg-semibold text-text-primary text-center">직원 추가</h2>
          <Input
            label="이름"
            value={form.nickname}
            maxLength={30}
            error={errors.nickname}
            onChange={(e) => set("nickname")(e.target.value)}
          />
          <Input
            label="이메일 (로그인 아이디)"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(e) => set("email")(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-md-medium text-text-primary">
              팀
              <select className={SELECT_STYLE} value={form.groupId} onChange={(e) => set("groupId")(e.target.value)}>
                <option value="">나중에 배정</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-md-medium text-text-primary">
              팀 역할
              <select
                className={SELECT_STYLE}
                value={form.teamRole}
                disabled={!form.groupId}
                onChange={(e) => set("teamRole")(e.target.value)}
              >
                <option value="MEMBER">직원</option>
                <option value="ADMIN">팀장</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-md-medium text-text-primary">
            근태 정책
            <select className={SELECT_STYLE} value={form.policyId} onChange={(e) => set("policyId")(e.target.value)}>
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
          <label className="flex flex-col gap-2 text-md-medium text-text-primary">
            회사 역할
            <select
              className={SELECT_STYLE}
              value={form.companyRole}
              onChange={(e) => set("companyRole")(e.target.value)}
            >
              <option value="EMPLOYEE">직원</option>
              <option value="HR_ADMIN">인사담당자</option>
            </select>
          </label>
          <p className="rounded-xl bg-background-secondary px-3.5 py-3 text-sm-medium text-text-default">
            임시 비밀번호가 만들어져요. 등록이 끝나면 한 번만 보여줘요.
          </p>
          <BaseButton
            variant="solid"
            size="large"
            onClick={submit}
            disabled={isPending || !form.nickname.trim() || !form.email.trim()}
          >
            {isPending ? "등록 중..." : "추가하기"}
          </BaseButton>
        </>
      )}
    </Modal>
  );
};

export default RegisterEmployeeModal;
