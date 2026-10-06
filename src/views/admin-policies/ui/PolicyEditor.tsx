"use client";

import { useState } from "react";
import { onTimeDeadline, toEnginePolicy, type Policy, type PolicyInfo, type PolicyType } from "@/entities/attendance";
import type { AdminPolicy } from "@/entities/employee";
import { useDeletePolicy, useSavePolicy, useSetDefaultPolicy } from "@/features/policy/manage-policy";
import { cn } from "@/shared/lib/cn";
import { BaseButton } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const TYPES: { type: PolicyType; name: string; desc: string }[] = [
  { type: "AUTONOMOUS", name: "자율", desc: "기록만 있으면 정상" },
  { type: "CORE_TIME", name: "코어타임", desc: "시작 시각까지 출근" },
  { type: "FIXED", name: "고정", desc: "출근 시각 + 유예" },
];

const FIELD_STYLE =
  "h-12 w-full rounded-xl border border-border-primary bg-background-secondary px-3.5 text-lg-regular text-text-primary";

interface PolicyEditorProps {
  /** 없으면 새 정책 */
  policy: AdminPolicy<PolicyInfo> | null;
  onSaved: (id: number) => void;
  onDeleted: () => void;
}

/** 입력값 → 엔진 Policy. 유효하지 않으면 이유를 돌려준다 (DB CHECK와 같은 규칙) */
const buildPolicy = (form: {
  type: PolicyType;
  coreStart: string;
  coreEnd: string;
  workStart: string;
  graceMinutes: string;
}): { policy: Policy } | { error: string } => {
  if (form.type === "AUTONOMOUS") return { policy: { type: "AUTONOMOUS" } };
  if (form.type === "CORE_TIME") {
    if (!form.coreStart || !form.coreEnd) return { error: "코어타임 시작과 끝을 입력해주세요." };
    if (form.coreStart >= form.coreEnd) return { error: "코어타임 시작은 끝보다 빨라야 해요." };
    return { policy: { type: "CORE_TIME", coreStart: form.coreStart, coreEnd: form.coreEnd } };
  }
  const grace = Number(form.graceMinutes);
  if (!form.workStart) return { error: "출근 시각을 입력해주세요." };
  if (!Number.isInteger(grace) || grace < 0 || grace > 180) return { error: "유예는 0~180분이에요." };
  return { policy: { type: "FIXED", workStart: form.workStart, graceMinutes: grace } };
};

/**
 * 정책 만들기·수정. 유형별 입력과 판정 규칙 문장을 보여준다.
 * "저장하면 이렇게 바뀌어요" 미리보기는 범위 밖 (roadmap §0, 시뮬레이터)
 */
const PolicyEditor = ({ policy, onSaved, onDeleted }: PolicyEditorProps) => {
  const engine = policy ? toEnginePolicy(policy) : null;
  const [name, setName] = useState(policy?.name ?? "");
  const [form, setForm] = useState({
    type: (engine?.type ?? "FIXED") as PolicyType,
    coreStart: engine?.type === "CORE_TIME" ? engine.coreStart : "10:00",
    coreEnd: engine?.type === "CORE_TIME" ? engine.coreEnd : "16:00",
    workStart: engine?.type === "FIXED" ? engine.workStart : "09:00",
    graceMinutes: engine?.type === "FIXED" ? String(engine.graceMinutes) : "10",
  });

  const { mutate: save, isPending: isSaving } = useSavePolicy();
  const { mutate: remove, isPending: isDeleting } = useDeletePolicy();
  const { mutate: makeDefault, isPending: isSettingDefault } = useSetDefaultPolicy();

  const built = buildPolicy(form);
  const deadline = "policy" in built ? onTimeDeadline(built.policy) : null;
  const canDelete = policy && !policy.isDefault && policy.assignedCount === 0;
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!("policy" in built) || !name.trim()) return;
    save({ id: policy?.id, name, policy: built.policy }, { onSuccess: onSaved });
  };

  return (
    <section
      aria-labelledby="policy-editor-title"
      className="flex-1 min-w-0 rounded-[20px] bg-background-primary p-5 tablet:p-7 flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="policy-editor-title" className="text-xl-semibold text-text-primary">
          {policy ? policy.name : "새 정책"}
          {policy?.isDefault && (
            <span className="ml-2 align-middle rounded px-1.5 text-xs-medium bg-brand-secondary text-icon-brand">
              기본
            </span>
          )}
        </h2>
        {policy && <span className="text-sm-medium text-text-default">{policy.employeeCount}명 적용 중</span>}
      </div>

      <Input
        label="이름"
        value={name}
        maxLength={50}
        placeholder="예: 고정 근무 09:00"
        onChange={(e) => setName(e.target.value)}
      />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-lg-medium text-text-primary">유형</legend>
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-2">
          {TYPES.map(({ type, name: typeName, desc }) => (
            <label
              key={type}
              className={cn(
                "flex flex-col gap-1 rounded-[14px] bg-background-secondary p-3.5 cursor-pointer border",
                form.type === type ? "border-2 border-brand-primary" : "border-border-primary",
              )}
            >
              <span className="flex items-center gap-2 text-lg-semibold text-text-primary">
                <input
                  type="radio"
                  name="policy-type"
                  value={type}
                  checked={form.type === type}
                  onChange={() => set("type")(type)}
                  className="accent-brand-primary"
                />
                {typeName}
              </span>
              <span className="text-xs-regular text-text-default">{desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {form.type === "CORE_TIME" && (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-md-medium text-text-primary">
            코어타임 시작
            <input
              type="time"
              className={FIELD_STYLE}
              value={form.coreStart}
              onChange={(e) => set("coreStart")(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-md-medium text-text-primary">
            코어타임 끝
            <input
              type="time"
              className={FIELD_STYLE}
              value={form.coreEnd}
              onChange={(e) => set("coreEnd")(e.target.value)}
            />
          </label>
        </div>
      )}
      {form.type === "FIXED" && (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-md-medium text-text-primary">
            출근 시각
            <input
              type="time"
              className={FIELD_STYLE}
              value={form.workStart}
              onChange={(e) => set("workStart")(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-md-medium text-text-primary">
            유예 (분)
            <input
              type="number"
              min={0}
              max={180}
              className={FIELD_STYLE}
              value={form.graceMinutes}
              onChange={(e) => set("graceMinutes")(e.target.value)}
            />
          </label>
        </div>
      )}

      <div className="rounded-2xl bg-background-secondary px-5 py-4 flex flex-col gap-2.5">
        <span className="text-md-semibold text-text-primary">판정 규칙</span>
        {"error" in built ? (
          <p className="text-md-regular text-status-danger">{built.error}</p>
        ) : (
          <ul className="list-disc pl-[18px] flex flex-col gap-1.5 text-md-regular text-text-secondary">
            <li>
              {deadline === null ? (
                <>
                  출근 기록이 있으면 시각과 상관없이 → <strong className="text-icon-brand">정상</strong>
                </>
              ) : (
                <>
                  {deadline}까지 출근 → <strong className="text-icon-brand">정상</strong>, {deadline} 이후 출근 →{" "}
                  <strong className="text-point-orange">지각</strong>
                  {"policy" in built && built.policy.type === "FIXED" && built.policy.graceMinutes > 0 && (
                    <>
                      {" "}
                      (출근 {built.policy.workStart} + 유예 {built.policy.graceMinutes}분)
                    </>
                  )}
                </>
              )}
            </li>
            <li>
              평일에 기록이 없으면 → <strong className="text-status-danger">결근</strong> (오늘과 미래는 판정하지 않음)
            </li>
            <li>
              승인된 휴가 → <strong className="text-point-purple">휴가</strong>, 주말과 입사 전은 판정하지 않음
            </li>
          </ul>
        )}
        <p className="text-xs-regular text-text-default">
          판정은 저장하지 않아요. 정책을 바꾸면 지난 기록도 새 정책으로 다시 판정돼요.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {policy && !policy.isDefault && (
            <button
              type="button"
              disabled={isSettingDefault}
              onClick={() => makeDefault(policy.id)}
              className="h-12 px-4 rounded-xl border border-border-secondary text-md-semibold text-text-secondary hover:bg-background-tertiary disabled:opacity-50"
            >
              기본 정책으로
            </button>
          )}
          {policy && !policy.isDefault && (
            <button
              type="button"
              disabled={!canDelete || isDeleting}
              title={canDelete ? undefined : "배정된 직원이 있으면 지울 수 없어요"}
              onClick={() => remove(policy.id, { onSuccess: onDeleted })}
              className="h-12 px-4 rounded-xl text-md-semibold text-status-danger hover:bg-background-tertiary disabled:opacity-40"
            >
              삭제
            </button>
          )}
        </div>
        <BaseButton
          variant="solid"
          size="large"
          className="w-auto px-6"
          onClick={submit}
          disabled={isSaving || !name.trim() || "error" in built}
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </BaseButton>
      </div>
    </section>
  );
};

export default PolicyEditor;
