import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";
import QueryProviders from "./_providers/QueryProvider";
import PresenceProvider from "./_providers/PresenceProvider";
import { Toaster as ToasterContainer } from "@/shared/ui/toast";
import { Sidebar } from "@/widgets/sidebar";
import { SIDEBAR_OPEN_COOKIE } from "@/shared/config/sidebar";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  fallback: ["Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Coworkers",
  description: "팀원들과 함께하는 일정 관리 서비스. 함께 일정을 계획하고 관리해보세요.",
  openGraph: {
    title: "Coworkers",
    description: "팀원들과 함께하는 일정 관리 서비스. 함께 일정을 계획하고 관리해보세요.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 사이드바를 접어 둔 값을 서버에서 읽어 처음부터 그 상태로 그린다 (브라우저에서 읽으면 펼쳤다가 접히며 깜빡였다)
  const sidebarOpen = (await cookies()).get(SIDEBAR_OPEN_COOKIE)?.value;
  return (
    <html lang="ko" className={pretendard.className} suppressHydrationWarning>
      <body className="flex flex-col tablet:flex-row pc:flex-row">
        <QueryProviders>
          <PresenceProvider />
          <Sidebar initialOpen={sidebarOpen !== "false"} />
          <main className="flex-1 min-w-0 bg-background-secondary">{children}</main>
          <ToasterContainer />
        </QueryProviders>
        <div id="portal-root" />
      </body>
    </html>
  );
}
