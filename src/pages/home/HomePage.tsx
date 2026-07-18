// Public homepage: hero, then three sections (Explore, services grid, About)
// sharing one content backdrop with the decorative watermark, then the call
// to action.
import { HeroSection } from "@/pages/home/sections/HeroSection/HeroSection";
import { ExploreSection } from "@/pages/home/sections/ExploreSection/ExploreSection";
import { ServiceOverviewSection } from "@/pages/home/sections/ServiceOverviewSection/ServiceOverviewSection";
import { AboutSection } from "@/pages/home/sections/AboutSection/AboutSection";
import { CallToActionSection } from "@/pages/home/sections/CallToActionSection/CallToActionSection";
import backgroundWord from "@/assets/images/background-word.png";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <div className={styles.contentBackdrop}>
        <img
          src={backgroundWord}
          alt=""
          aria-hidden="true"
          className={styles.backgroundWord}
        />
        <ExploreSection />
        <ServiceOverviewSection />
        <AboutSection />
      </div>
      <CallToActionSection />
    </>
  );
}
