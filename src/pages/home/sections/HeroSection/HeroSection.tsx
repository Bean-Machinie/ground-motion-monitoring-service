// Homepage hero: 4-slide auto-rotating carousel (keen-slider) with layered
// background image, dark overlay, and text/CTA content per slide.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import arrowAsset from "@/assets/icons/arrow.svg";
import heroAsset from "@/assets/images/hero_1.png";
import heroSlide2Asset from "@/assets/images/hero_2.png";
import heroSlide3Asset from "@/assets/images/hero_3.png";
import heroSlide4Asset from "@/assets/images/hero_4.png";
import styles from "./HeroSection.module.css";

const heroSlides = [
  {
    image: heroAsset,
    headline: "See What Moves Before It ",
    highlight: "Matters",
    subtext:
      "Satellite-based ground deformation monitoring for critical infrastructure. We turn complex radar data into clear, actionable insight — so you can detect risk early and act with confidence.",
    ctaLabel: "Start a Ground Motion Request",
    ctaPath: "/workspace/new-request",
  },
  {
    image: heroSlide2Asset,
    headline: "Monitor What Keeps the World ",
    highlight: "Moving",
    subtext:
      "Railways, roads, and bridges require continuous stability. We detect subtle ground movement early to support maintenance and reduce disruption.",
    ctaLabel: "Explore Infrastructure Monitoring",
    ctaPath: "/services/monitoring",
  },
  {
    image: heroSlide3Asset,
    headline: "Stay Ahead of Ground ",
    highlight: "Movement",
    subtext:
      "Mining sites and surrounding terrain can change over time. We monitor deformation to support safer operations, planning, and risk management.",
    ctaLabel: "Explore Mining Solutions",
    ctaPath: "/industries/mining",
  },
  {
    image: heroSlide4Asset,
    headline: "Build on a Foundation of ",
    highlight: "Insight",
    subtext:
      "Urban development and large construction projects require precise monitoring. We track ground deformation to support planning and long-term stability.",
    ctaLabel: "Explore Urban & Construction",
    ctaPath: "/industries/urban-construction",
  },
];

function HeroArrow({
  left,
  onClick,
  disabled,
}: {
  left?: boolean;
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${styles.heroArrow} ${left ? styles.heroArrowLeft : styles.heroArrowRight}${disabled ? ` ${styles.heroArrowDisabled}` : ""}`}
      aria-label={left ? "Previous slide" : "Next slide"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        {left ? (
          <path d="M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z" />
        ) : (
          <path d="M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z" />
        )}
      </svg>
    </button>
  );
}

export function HeroSection() {
  const AUTOPLAY_MS = 12_000;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    setTimerKey((k) => k + 1);
  }, []);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    initial: 0,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
    dragStarted() {
      resetTimer();
    },
  });

  useEffect(() => {
    if (!loaded) return;
    timerRef.current = setTimeout(() => {
      instanceRef.current?.next();
      setTimerKey((k) => k + 1);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loaded, timerKey]);

  return (
    <section className={styles.hero}>
      <div ref={sliderRef} className={`keen-slider ${styles.heroKeen}`}>
        {heroSlides.map((slide, idx) => (
          <div key={idx} className={`keen-slider__slide ${styles.heroSlide}`}>
            <img src={slide.image} alt="" className={styles.heroImage} />
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <h1>
                {slide.headline}
                <span>{slide.highlight}</span>
              </h1>
              <p>{slide.subtext}</p>
              <div className={styles.heroActions}>
                <Link to={slide.ctaPath} className={styles.ctaButton}>
                  <span>{slide.ctaLabel}</span>
                  <img src={arrowAsset} alt="" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {loaded && instanceRef.current && (
        <>
          <HeroArrow
            left
            onClick={(e) => {
              e.stopPropagation();
              instanceRef.current?.prev();
              resetTimer();
            }}
            disabled={false}
          />
          <HeroArrow
            onClick={(e) => {
              e.stopPropagation();
              instanceRef.current?.next();
              resetTimer();
            }}
            disabled={false}
          />
          <div className={styles.heroDots}>
            {heroSlides.map((_, idx) => {
              const isActive = currentSlide === idx;
              return (
                <button
                  key={idx}
                  className={`${styles.heroDot}${isActive ? ` ${styles.heroDotActive}` : ""}`}
                  onClick={() => {
                    instanceRef.current?.moveToIdx(idx);
                    resetTimer();
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
