"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useGetUser } from "@/entities/user";
import { usePresenceStore } from "@/entities/presence";
import { getSupabase } from "@/shared/api/supabase/client";
import { isSupabase } from "@/shared/config/backend";
import { PRESENCE_CHOICE_LABEL, PRESENCE_STATUSES, PresenceStatus } from "@/shared/config/presence";
import type { UserResponse } from "@/shared/api/types/UserType";
import { DropdownOption } from "@/shared/ui/dropdown";
import { StatusDot } from "@/shared/ui/profile";
import { toastKit } from "@/shared/lib/toastKit";

/**
 * 내 접속 상태를 고르는 드롭다운 항목. 기존 API 모드에서는 빈 배열 (실시간 기능 없음).
 * 고른 상태는 profiles.presence_status에 저장해서 다른 기기에서도 이어진다.
 */
const usePresenceStatusOptions = (): DropdownOption[] => {
  const queryClient = useQueryClient();
  const { data: user } = useGetUser();
  const chosen = usePresenceStore((state) => state.chosen) ?? user?.presenceStatus ?? "online";
  const setChosen = usePresenceStore((state) => state.setChosen);
  const { error } = toastKit();

  if (!isSupabase || !user) return [];

  const changeStatus = async (status: PresenceStatus) => {
    const previous = chosen;
    setChosen(status);

    const { data, error: updateError } = await getSupabase()
      .from("profiles")
      .update({ presence_status: status })
      .eq("id", user.id)
      .select("id");

    if (updateError || !data?.length) {
      setChosen(previous);
      error("상태를 바꾸지 못했습니다.");
      return;
    }
    queryClient.setQueryData<UserResponse>(["user"], (old) => (old ? { ...old, presenceStatus: status } : old));
  };

  return PRESENCE_STATUSES.map((status) => ({
    label: PRESENCE_CHOICE_LABEL[status],
    icon: <StatusDot status={status} size="sm" />,
    selected: status === chosen,
    action: () => void changeStatus(status),
  }));
};

export default usePresenceStatusOptions;
