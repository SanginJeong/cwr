import { useEffect, useState } from "react";

/** intervalMs마다 갱신되는 현재 시각 (근무 시간처럼 흐르는 값 표시용) */
const useNow = (intervalMs = 60_000) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};

export default useNow;
