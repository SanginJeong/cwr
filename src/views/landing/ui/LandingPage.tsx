import { cookies } from "next/headers";
import HeroSection from "@/widgets/landing/ui/HeroSection/HeroSection";
import KanbanSection from "@/widgets/landing/ui/KanbanSection/KanbanSection";
import DetailSection from "@/widgets/landing/ui/DetailSection/DetailSection";
import CooperationSection from "@/widgets/landing/ui/CooperationSection/CooperationSection";
import ConversionSection from "@/widgets/landing/ui/ConversionSection/ConversionSection";
import LandingOnboarding from "@/widgets/onboarding/ui/LoadingOnboarding/LoadingOnboarding";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  const startDestination = token ? "/team" : "/login";

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
