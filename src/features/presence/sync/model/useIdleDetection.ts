import { useEffect } from "react";
import { usePresenceStore } from "@/entities/presence";
import { PRESENCE_IDLE_MS } from "@/shared/config/presence";

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;

/** 일정 시간 입력이 없으면 isIdle을 켠다. 다시 움직이면 끈다 */
const useIdleDetection = (enabled: boolean) => {
  const setIdle = usePresenceStore((state) => state.setIdle);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout>;
    let lastActivity = 0;

    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), PRESENCE_IDLE_MS);
    };

    const handleActivity = () => {
      // pointermove가 많이 들어와서 1초에 한 번만 처리한다
      const now = Date.now();
      if (now - lastActivity < 1000) return;
      lastActivity = now;
      if (usePresenceStore.getState().isIdle) setIdle(false);
      restart();
    };

    restart();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      setIdle(false);
    };
  }, [enabled, setIdle]);
};

export default useIdleDetection;
