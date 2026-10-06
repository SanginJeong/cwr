"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/shared/api/queryClient";

const QueryProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 오른쪽 아래는 팀 채팅 버튼 자리라서 위로 옮긴다 (개발 모드에서만 보임) */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
    </QueryClientProvider>
  );
};

export default QueryProviders;
