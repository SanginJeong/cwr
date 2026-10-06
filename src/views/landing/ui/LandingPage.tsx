import { HeroSection } from "@/widgets/landing";
import { KanbanSection } from "@/widgets/landing";
import { DetailSection } from "@/widgets/landing";
import { CooperationSection } from "@/widgets/landing";
import { ConversionSection } from "@/widgets/landing";
import { LoadingOnboarding as LandingOnboarding } from "@/widgets/onboarding";
import { ROUTES } from "@/shared/config/routes";
import { hasServerSession } from "@/shared/api/serverApi";

export default async function Page() {
  const startDestination = (await hasServerSession()) ? ROUTES.attendance : ROUTES.login;

  return (
    <main className="mobile:h-[calc(100vh-52px)] min-w-0 min-h-screen overflow-x-hidden">
      <HeroSection link={startDestination} />
      <KanbanSection />
      <DetailSection />
      <CooperationSection />
      <ConversionSection link={startDestination} />
      <LandingOnboarding />
    </main>
  );
}
