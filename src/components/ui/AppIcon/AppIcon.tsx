// Renders a named icon from the asset registry as a fixed-size image.
import { ICONS, type IconName } from "@/lib/icons";

interface AppIconProps {
  name: IconName;
  size?: number;
}

export function AppIcon({ name, size = 16 }: AppIconProps) {
  return (
    <img
      src={ICONS[name]}
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
    />
  );
}
