import type { Database } from "./database.types";
import type { TaskJson } from "./mappers/task";
import type { GetGroupsResponse } from "@/shared/api/types/groupApi";
import type { GetTaskDetailResponse, Recurring } from "@/shared/api/types/taskApi";
import type { User, Membership } from "@/shared/api/types/UserType";

/**
 * database.types.ts는 `npm run db:types`로 생성한다 (직접 고치지 않는다).
 * 생성된 타입이 표현하지 못하는 두 가지를 여기서 보완한다.
 */

// ── 1. jsonb를 돌려주는 RPC ──
// 생성된 타입에서는 반환이 Json이다. SQL의 *_json 함수가 만드는 모양을 선언해 둔다.

export type MeJson = Omit<User, "teamId" | "memberships"> & {
  memberships: (Omit<Membership, "group"> & { group: Omit<Membership["group"], "teamId"> })[];
};

export interface RpcJsonReturns {
  get_me: MeJson;
  get_group: Omit<GetGroupsResponse, "teamId">;
  get_task: GetTaskDetailResponse;
  tasks_for_date: TaskJson[];
  update_task: TaskJson;
  user_history: { tasksDone: TaskJson[] };
  create_group: { id: number; name: string; image: string | null; createdAt: string; updatedAt: string };
  create_recurring: Recurring;
  accept_invitation: { groupId: number };
  update_my_profile: { id: number; nickname: string; image: string | null };
}

/** rpc() 결과(Json)를 SQL이 실제로 만드는 모양으로 읽는다 */
export const rpcJson = <N extends keyof RpcJsonReturns>(_name: N, data: unknown) => data as RpcJsonReturns[N];

// ── 2. 뷰 ──
// 뷰의 컬럼은 원본 테이블에서 not null이어도 모두 nullable로 생성된다.

type Views = Database["public"]["Views"];

/** 뷰 행에서 Nullable로 지정한 컬럼만 null을 허용하고 나머지는 not null로 되돌린다 */
export type ViewRow<V extends keyof Views, Nullable extends keyof Views[V]["Row"] = never> = {
  [K in Exclude<keyof Views[V]["Row"], Nullable>]: NonNullable<Views[V]["Row"][K]>;
} & {
  [K in Nullable]: Views[V]["Row"][K];
};
