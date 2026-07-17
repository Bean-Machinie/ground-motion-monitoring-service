// Central registry of icon assets so components reference icons by name.
import satellite from "@/assets/icons/satellite_icon.svg";
import graph from "@/assets/icons/graph.svg";
import profile from "@/assets/icons/menu-profile.svg";
import settings from "@/assets/icons/menu-settings.svg";
import logout from "@/assets/icons/menu-logout.svg";
import shieldLock from "@/assets/icons/shield-lock.svg";
import userGroup from "@/assets/icons/user-group.svg";
import linkedin from "@/assets/icons/linkedin.svg";
import instagram from "@/assets/icons/instagram.svg";
import bell from "@/assets/icons/bell.svg";
import file from "@/assets/icons/file.svg";
import globe from "@/assets/icons/globe.svg";

export const ICONS = {
  satellite,
  graph,
  profile,
  settings,
  logout,
  "shield-lock": shieldLock,
  "user-group": userGroup,
  linkedin,
  instagram,
  bell,
  file,
  globe,
} as const;

export type IconName = keyof typeof ICONS;
