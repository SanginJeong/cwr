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
    <main className="mobile:h-[calc(100vh-52px)] min-w-0 min-h-screen overflow-x-hidden">
      <HeroSection link={startDestination} />
      <AttendanceSection />
      <LeaveSection />
      <TeamSection />
      <ConversionSection link={startDestination} />
      <LandingOnboarding />
    </main>
  );
}
