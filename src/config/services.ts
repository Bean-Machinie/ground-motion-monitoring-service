// Service catalogue: single source of truth for the services overview page,
// the /services/:slug detail pages, the homepage cards, and navigation.
// Add a new service here and it appears everywhere automatically.
import deformationImage from "@/assets/images/offering-deformation.jpg";
import riskImage from "@/assets/images/offering-risk.jpg";
import researchImage from "@/assets/images/offering-research.jpg";

export interface ServiceSection {
  heading: string;
  text: string;
}

export interface ServiceDef {
  slug: string;
  name: string;
  eyebrow: string;
  /** Short card copy. */
  summary: string;
  /** Detail page intro paragraph. */
  lede: string;
  image: string;
  sections: ServiceSection[];
}

export const SERVICES: ServiceDef[] = [
  {
    slug: "screening",
    name: "Screening",
    eyebrow: "Analysis",
    summary: "One-time check: is your site moving?",
    lede:
      "A one-time InSAR assessment of your site or asset. We process the " +
      "available satellite radar archive and tell you clearly whether — and " +
      "where — the ground is moving.",
    image: deformationImage,
    sections: [
      {
        heading: "What you get",
        text:
          "A deformation velocity map of your area of interest, a written " +
          "assessment of observed movement, and a clear recommendation on " +
          "whether continued monitoring is warranted.",
      },
      {
        heading: "When to use it",
        text:
          "Due diligence before acquisition or construction, establishing a " +
          "movement baseline for a new project, or a quick answer when " +
          "unexpected cracking or settlement appears.",
      },
    ],
  },
  {
    slug: "monitoring",
    name: "Monitoring",
    eyebrow: "Operations",
    summary:
      "Continuous tracking with change alerts. Recurring, and includes early-warning signals.",
    lede:
      "Recurring satellite-based monitoring of your site with structured " +
      "reporting and change alerts, so slow-moving risk is caught while " +
      "there is still time to act.",
    image: riskImage,
    sections: [
      {
        heading: "What you get",
        text:
          "Scheduled monitoring updates delivered through the portal, " +
          "deformation time series for your assets, and alerting when " +
          "movement exceeds agreed thresholds — including early-warning " +
          "signals ahead of critical change.",
      },
      {
        heading: "When to use it",
        text:
          "Operational mines and tailings facilities, rail and road " +
          "corridors, dams and levees, and any long-lived asset where " +
          "gradual ground movement translates into maintenance cost or " +
          "safety risk.",
      },
    ],
  },
  {
    slug: "research-collaboration",
    name: "Research & Collaboration",
    eyebrow: "Science",
    summary:
      "Bespoke studies and scientific partnerships — our premium custom work.",
    lede:
      "Custom InSAR studies and long-term scientific partnerships for " +
      "problems that do not fit a standard product.",
    image: researchImage,
    sections: [
      {
        heading: "What we offer",
        text:
          "Method development, tailored processing chains, joint research " +
          "projects, and co-authored studies — built around your data, your " +
          "site, and your question.",
      },
      {
        heading: "Who it is for",
        text:
          "Research institutions, public agencies, and engineering teams " +
          "that need deeper analysis than an off-the-shelf deliverable, or " +
          "want a scientific partner across multiple sites and years.",
      },
    ],
  },
];

export function getService(slug: string): ServiceDef | undefined {
  return SERVICES.find((service) => service.slug === slug);
}
