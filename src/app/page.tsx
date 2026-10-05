import { cookies } from "next/headers";
import HeroSection from "./(route)/_landing/_components/HeroSection/HeroSection";
import KanbanSection from "./(route)/_landing/_components/KanbanSection/KanbanSection";
import DetailSection from "./(route)/_landing/_components/DetailSection/DetailSection";
import CooperationSection from "./(route)/_landing/_components/CooperationSection/CooperationSection";
import ConversionSection from "./(route)/_landing/_components/ConversionSection/ConversionSection";
import LandingOnboarding from "./(route)/_components/LoadingOnboarding/LoadingOnboarding";

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
