// Public homepage: hero, service overview, process, and call to action.
import { HeroSection } from "@/pages/home/sections/HeroSection/HeroSection";
import { ServiceOverviewSection } from "@/pages/home/sections/ServiceOverviewSection/ServiceOverviewSection";
import { ProcessSection } from "@/pages/home/sections/ProcessSection/ProcessSection";
import { CallToActionSection } from "@/pages/home/sections/CallToActionSection/CallToActionSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <ServiceOverviewSection />
      <ProcessSection />
      <CallToActionSection />
    </>
  );
}
