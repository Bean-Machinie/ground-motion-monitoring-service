// Public homepage: hero, explore intro + services grid (shared earth
// backdrop), about story, process, and call to action.
import { HeroSection } from "@/pages/home/sections/HeroSection/HeroSection";
import { ExploreSection } from "@/pages/home/sections/ExploreSection/ExploreSection";
import { ServiceOverviewSection } from "@/pages/home/sections/ServiceOverviewSection/ServiceOverviewSection";
import { AboutSection } from "@/pages/home/sections/AboutSection/AboutSection";
import { ProcessSection } from "@/pages/home/sections/ProcessSection/ProcessSection";
import { CallToActionSection } from "@/pages/home/sections/CallToActionSection/CallToActionSection";
import earthBackdrop from "@/assets/images/back_earth_yellow.png";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <div className={styles.exploreArea}>
        <img
          src={earthBackdrop}
          alt=""
          aria-hidden="true"
          className={styles.earthBg}
        />
        <ExploreSection />
        <ServiceOverviewSection />
      </div>
      <AboutSection />
      <ProcessSection />
      <CallToActionSection />
    </>
  );
}
