// Small inline SVG icons for dropdown menu entries.
import type { NavIconName } from "@/config/navigation";

const PATHS: Record<NavIconName, string> = {
  monitor:
    "M3 17l4-6 3 4 4-8 4 10H3zm0 2h18v2H3v-2z",
  steps:
    "M4 19h4v-4H4v4zm6 0h4v-8h-4v8zm6 0h4V7h-4v12z",
  user:
    "M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4.5V20h14v-1.5c0-2.5-3-4.5-7-4.5z",
  "sign-out":
    "M10 4h9v16h-9v-2h7V6h-7V4zm-1 4l-5 4 5 4v-3h6v-2H9V8z",
  projects:
    "M4 6h6l2 2h8v11H4V6zm0-2v1-1z",
};

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
