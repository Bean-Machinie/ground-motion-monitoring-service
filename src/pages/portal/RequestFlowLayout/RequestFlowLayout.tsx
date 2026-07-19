// Shared frame for the new-request flow (/requests/new and
// /requests/new/expert). Its one job is the decorative yellow globe:
// because the layout stays mounted while the child route swaps, the
// globe can glide from the top-left (chooser) to the bottom-right
// (specialist form) as a single continuous CSS transition instead of
// popping between two static positions.
import { Outlet, useLocation } from "react-router-dom";
import earthYellow from "@/assets/images/back_earth_yellow.png";
import styles from "./RequestFlowLayout.module.css";

export function RequestFlowLayout() {
  const { pathname } = useLocation();
  const onExpertPage = pathname.endsWith("/expert");

  return (
    <div className={styles.flow}>
      {/* Anchored to the shell's content column, not the centered
          content box — see the module CSS. */}
      <div className={styles.backdrop} aria-hidden="true">
        <img
          src={earthYellow}
          alt=""
          className={`${styles.globe} ${
            onExpertPage ? styles.globeBottomRight : styles.globeTopLeft
          }`}
        />
      </div>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
