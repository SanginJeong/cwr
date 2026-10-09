import { getAdminSupabase } from "../../src/shared/api/supabase/admin";
import { SEED_PEOPLE, SEED_POLICIES, SEED_TASK_LISTS, SEED_TEAMS, seedEmail, type SeedPolicyKey } from "./data";
import { addDays, generateSeedAttendance, hiredOnOf, policyOf } from "./generate";

type Admin = ReturnType<typeof getAdminSupabase>;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const kstNow = () => new Date(Date.now() + KST_OFFSET_MS).toISOString();
const kst = (date: string, time: string) => `${date}T${time}+09:00`;

/** 시드 계정의 비밀번호. 로컬 Supabase 스택에서만 쓰는 값이라 코드에 둔다 (E2E가 이 값으로 로그인한다) */
export const E2E_PASSWORD = "e2e-Password-1!";

/** 에러만 확인한다 (결과 행을 받지 않는 update·delete) */
const must = (result: { error: { message: string } | null }, step: string) => {
  if (result.error) throw new Error(`${step}: ${result.error.message}`);
};

/** 결과 행까지 필요할 때 */
const required = <T>(result: { data: T; error: { message: string } | null }, step: string): NonNullable<T> => {
  must(result, step);
  if (result.data === null || result.data === undefined) throw new Error(`${step}: 응답 없음`);
  return result.data as NonNullable<T>;
};

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/** 정책: 시드 정책은 이름으로 찾아 정해진 값으로 되돌리고, 자율 출퇴근을 기본 정책으로 되돌린다 */
const ensurePolicies = async (admin: Admin): Promise<Record<SeedPolicyKey, number | null>> => {
  const ids: Record<SeedPolicyKey, number | null> = { FIXED: null, CORE: null, AUTO: null };
  for (const key of ["FIXED", "CORE"] as const) {
    const policy: {
      name: string;
      type: string;
      work_start?: string;
      grace_minutes?: number;
      core_start?: string;
      core_end?: string;
    } = SEED_POLICIES[key];
    // 유형에 쓰지 않는 칸은 null (DB CHECK)
    const row = {
      name: policy.name,
      type: policy.type,
      core_start: policy.core_start ?? null,
      core_end: policy.core_end ?? null,
      work_start: policy.work_start ?? null,
      grace_minutes: policy.grace_minutes ?? null,
    };
    const existing = required(await admin.from("policies").select("id").eq("name", row.name).limit(1), "정책 조회");
    ids[key] = existing[0]
      ? required(await admin.from("policies").update(row).eq("id", existing[0].id).select("id").single(), "정책 복구")
          .id
      : required(await admin.from("policies").insert(row).select("id").single(), "정책 생성").id;
  }

  // 기본 정책 = 자율 출퇴근 (마이그레이션 시드). 테스트가 바꿨으면 되돌린다
  const auto = required(
    await admin.from("policies").select("id").eq("type", "AUTONOMOUS").order("id").limit(1),
    "기본 정책 조회",
  )[0];
  if (auto) {
    must(
      await admin.from("policies").update({ is_default: false }).eq("is_default", true).neq("id", auto.id),
      "기본 정책 해제",
    );
    must(await admin.from("policies").update({ is_default: true }).eq("id", auto.id), "기본 정책 지정");
  }
  return ids; // AUTO는 null(기본 정책을 따른다)
};

/** 팀: 이름으로 찾고 없으면 만든다 */
const ensureTeams = async (admin: Admin) => {
  const teamIds = new Map<string, number>();
  for (const team of SEED_TEAMS) {
    const existing = required(
      await admin.from("groups").select("id").eq("name", team.name).order("id").limit(1),
      "팀 조회",
    );
    const id = existing[0]
      ? existing[0].id
      : required(await admin.from("groups").insert({ name: team.name }).select("id").single(), "팀 생성").id;
    teamIds.set(team.name, id);
  }
  return teamIds;
};

/** 시드 계정: 없으면 만들고, 있으면 비밀번호·로그인 차단을 되돌린다. profile id를 돌려준다 */
const ensureUsers = async (admin: Admin, today: string, policyIds: Record<SeedPolicyKey, number | null>) => {
  const authIdByEmail = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`계정 목록: ${error.message}`);
    data.users.forEach((u) => u.email && authIdByEmail.set(u.email, u.id));
    if (data.users.length < 1000) break;
  }

  const profileIdByLocal = new Map<string, number>();
  for (const person of SEED_PEOPLE) {
    const email = seedEmail(person.local);
    let authId = authIdByEmail.get(email);
    if (!authId) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: E2E_PASSWORD,
        email_confirm: true,
        user_metadata: { nickname: person.nickname },
      });
      if (error || !data.user) throw new Error(`계정 생성(${email}): ${error?.message}`);
      authId = data.user.id;
    } else {
      // 테스트가 퇴사 처리하거나 비밀번호를 바꿨을 수 있다
      await admin.auth.admin.updateUserById(authId, { ban_duration: "none", password: E2E_PASSWORD });
    }

    const profile = required(
      await admin
        .from("profiles")
        .update({
          nickname: person.nickname,
          company_role: person.isHrAdmin ? "HR_ADMIN" : "EMPLOYEE",
          is_active: true,
          hired_on: hiredOnOf(person, today),
          policy_id: policyIds[policyOf(person)],
        })
        .eq("auth_id", authId)
        .select("id")
        .single(),
      `프로필(${email})`,
    );
    profileIdByLocal.set(person.local, profile.id);
  }
  return profileIdByLocal;
};

/**
 * E2E 테스트 데이터를 오늘 기준으로 만든다. 다시 실행해도 같은 결과가 나온다 (멱등).
 * - 시드 계정(@coworkers.test) 30명, 팀 4개, 정책 3종, 최근 3개월 출퇴근, 휴가(승인·반려·대기), 할 일 샘플
 * - 시드 계정의 출퇴근·휴가와 시드 팀의 멤버십·할 일 목록은 지우고 새로 만든다. 그 밖의 데이터는 건드리지 않는다
 * - 로컬 Supabase 스택에서만 돈다. 원격 DB면 바로 멈춘다
 */
export const seedTestData = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    throw new Error(`테스트 시드는 로컬 Supabase에서만 실행한다. 지금 NEXT_PUBLIC_SUPABASE_URL=${url || "(없음)"}`);
  }
  const admin = getAdminSupabase();
  const now = kstNow();
  const today = now.slice(0, 10);

  const policyIds = await ensurePolicies(admin);
  const teamIds = await ensureTeams(admin);
  const profileIds = await ensureUsers(admin, today, policyIds);
  const userIds = [...profileIds.values()];
  const groupIds = [...teamIds.values()];

  // 멤버십: 시드 계정과 시드 팀의 배정을 정해진 대로
  must(await admin.from("memberships").delete().in("user_id", userIds), "멤버십 정리");
  must(await admin.from("memberships").delete().in("group_id", groupIds), "멤버십 정리");
  must(
    await admin.from("memberships").insert(
      SEED_PEOPLE.filter((p) => p.team).map((p) => ({
        group_id: teamIds.get(p.team!)!,
        user_id: profileIds.get(p.local)!,
        role: p.isLeader ? "ADMIN" : "MEMBER",
      })),
    ),
    "멤버십 생성",
  );

  // 출퇴근·휴가
  const { records, leaves } = generateSeedAttendance(today, now.slice(11, 19));
  must(await admin.from("attendance_records").delete().in("user_id", userIds), "출퇴근 정리");
  must(await admin.from("leave_requests").delete().in("user_id", userIds), "휴가 정리");
  for (const rows of chunk(records, 500)) {
    must(
      await admin.from("attendance_records").insert(
        rows.map((r) => ({
          user_id: profileIds.get(r.local)!,
          date: r.date,
          clock_in_at: kst(r.date, r.clockIn),
          clock_out_at: r.clockOut ? kst(r.date, r.clockOut) : null,
        })),
      ),
      "출퇴근 생성",
    );
  }
  must(
    await admin.from("leave_requests").insert(
      leaves.map((l) => ({
        user_id: profileIds.get(l.local)!,
        date: l.date,
        status: l.status,
        reason: l.reason,
        decided_by: l.decidedByLocal ? profileIds.get(l.decidedByLocal)! : null,
        decided_at: l.status === "PENDING" ? null : kst(addDays(l.createdOn, 1), "10:00:00"),
        created_at: kst(l.createdOn, "09:30:00"),
      })),
    ),
    "휴가 생성",
  );

  // 할 일 샘플: 목록을 지우면 반복 규칙·할 일·댓글이 함께 지워진다 (cascade)
  must(await admin.from("task_lists").delete().in("group_id", groupIds), "할 일 정리");
  for (const team of SEED_TEAMS) {
    const groupId = teamIds.get(team.name)!;
    const leaderId = profileIds.get(SEED_PEOPLE.find((p) => p.team === team.name && p.isLeader)!.local)!;
    for (const list of SEED_TASK_LISTS[team.name]) {
      const taskList = required(
        await admin.from("task_lists").insert({ group_id: groupId, name: list.name }).select("id").single(),
        "할 일 목록 생성",
      );
      must(
        await admin.from("recurrings").insert(
          list.recurrings.map((r) => ({
            group_id: groupId,
            task_list_id: taskList.id,
            writer_id: leaderId,
            name: r.name,
            start_date: addDays(today, -14),
            frequency_type: r.frequency,
            week_days: r.weekDays ?? [],
          })),
        ),
        "반복 일정 생성",
      );
    }
  }

  return { today, users: userIds.length, teams: groupIds.length, records: records.length, leaves: leaves.length };
};
