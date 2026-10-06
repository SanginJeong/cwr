"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useGetUser } from "@/entities/user";
import { selectMyStatus, usePresenceStore } from "@/entities/presence";
import { getSupabase } from "@/shared/api/supabase/client";
import type { PresenceStatus } from "@/shared/config/presence";
import useIdleDetection from "./useIdleDetection";

interface PresencePayload {
  status: PresenceStatus;
}

/** 오프라인으로 표시를 고르면 채널에서 빠진다 (다른 사람에게는 접속하지 않은 것과 같다) */
const sendStatus = (channel: RealtimeChannel, status: PresenceStatus) => {
  if (channel.state !== "joined") return;
  if (status === "offline") void channel.untrack();
  else void channel.track({ status } satisfies PresencePayload);
};

/**
 * 내가 속한 모든 팀의 비공개 채널(team:{groupId})에 접속해서
 * 내 상태를 보내고 팀원들의 상태를 받는다. 앱에서 한 번만 쓴다 (app/_providers/PresenceProvider).
 * 채널 권한은 supabase/migrations/20261006000002_presence.sql의 RLS가 검사한다.
 */
const usePresenceSync = () => {
  const { data: user } = useGetUser();
  const { setChosen, setTeamMembers, reset } = usePresenceStore.getState();
  const myStatus = usePresenceStore(selectMyStatus);

  const channelsRef = useRef<RealtimeChannel[]>([]);
  const myStatusRef = useRef(myStatus);
  myStatusRef.current = myStatus;

  const enabled = !!user;
  useIdleDetection(enabled);

  // 다른 기기에서 고른 상태를 이어받는다
  useEffect(() => {
    if (user?.presenceStatus && usePresenceStore.getState().chosen === null) {
      setChosen(user.presenceStatus);
    }
  }, [user?.presenceStatus, setChosen]);

  const userId = user?.id;
  const groupIdsKey = user?.memberships.map((m) => m.groupId).join(",") ?? "";

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabase();
    const groupIds = groupIdsKey ? groupIdsKey.split(",").map(Number) : [];
    let cancelled = false;
    const channels: RealtimeChannel[] = [];

    const connect = async () => {
      // 비공개 채널은 RLS 검사를 위해 로그인 토큰이 필요하다
      await supabase.realtime.setAuth();
      if (cancelled) return;

      groupIds.forEach((groupId) => {
        const channel = supabase.channel(`team:${groupId}`, {
          config: { private: true, presence: { key: String(userId) } },
        });

        channel
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState<PresencePayload>();
            const members: Record<number, PresenceStatus> = {};
            Object.entries(state).forEach(([key, metas]) => {
              // 같은 사람이 여러 탭으로 접속하면 meta가 여러 개다. 하나라도 활동 중이면 활동 중
              const statuses = metas.map((meta) => meta.status);
              members[Number(key)] = statuses.includes("online") ? "online" : (statuses[0] ?? "online");
            });
            setTeamMembers(groupId, members);
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") sendStatus(channel, myStatusRef.current);
          });

        channels.push(channel);
      });
      channelsRef.current = channels;
    };

    void connect();

    return () => {
      cancelled = true;
      channels.forEach((channel) => void supabase.removeChannel(channel));
      channelsRef.current = [];
      reset();
    };
  }, [userId, groupIdsKey, setTeamMembers, reset]);

  // 상태가 바뀌면(직접 고르거나 자리 비움이 되면) 모든 팀 채널에 다시 보낸다
  useEffect(() => {
    channelsRef.current.forEach((channel) => sendStatus(channel, myStatus));
  }, [myStatus]);
};

export default usePresenceSync;
