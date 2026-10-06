"use client";

import { usePresenceSync } from "@/features/presence/sync";

/** 팀원 접속 상태를 실시간으로 주고받는다 (Supabase 모드에서만 동작) */
const PresenceProvider = () => {
  usePresenceSync();
  return null;
};

export default PresenceProvider;
