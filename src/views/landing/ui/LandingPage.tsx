import { HeroSection } from "@/widgets/landing";
import { AttendanceSection } from "@/widgets/landing";
import { LeaveSection } from "@/widgets/landing";
import { TeamSection } from "@/widgets/landing";
import { ConversionSection } from "@/widgets/landing";
import { LoadingOnboarding as LandingOnboarding } from "@/widgets/onboarding";
import { ROUTES } from "@/shared/config/routes";
import { hasServerSession } from "@/shared/api/serverApi";

export default async function Page() {
  const startDestination = (await hasServerSession()) ? ROUTES.attendance : ROUTES.login;

  return (
    // 바깥 레이아웃이 이미 <main>이다. 예전에는 여기도 <main>이라 본문 영역이 두 개였다
    // 가로만 자른다(clip). hidden이나 고정 높이를 주면 이 div가 따로 스크롤돼서, 창 스크롤을 보는 GSAP ScrollTrigger가
    // 모바일에서 끝내 실행되지 않아 아래 섹션 이미지가 투명한 채로 남았다
    <div className="min-w-0 min-h-screen overflow-x-clip">
      <HeroSection link={startDestination} />
      <AttendanceSection />
      <LeaveSection />
      <TeamSection />
      <ConversionSection link={startDestination} />
      <LandingOnboarding />
    </div>
  );
}
