import "../src/app/globals.css";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Preview } from "@storybook/nextjs";

// 사이드바의 출퇴근 카드처럼 React Query를 쓰는 컴포넌트를 위해. 스토리에서는 실제 요청이 실패하고 에러 상태로 보인다
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const preview: Preview = {
  decorators: [(Story) => createElement(QueryClientProvider, { client: queryClient }, createElement(Story))],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
};

export default preview;
