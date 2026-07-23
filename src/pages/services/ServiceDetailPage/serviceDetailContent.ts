// Rich content for the marketing service detail pages (/services/:slug),
// ported from the HELIOSYN design system prototype. This is deliberately
// separate from config/services.ts (which drives the overview cards, the
// homepage and navigation) so those surfaces stay untouched — this file
// only feeds the full service detail pages.
import deformationImage from "@/assets/images/offering-deformation.jpg";
import riskImage from "@/assets/images/offering-risk.jpg";
import researchImage from "@/assets/images/offering-research.jpg";

export interface Deliverable {
  title: string;
  text: string;
}

export interface MetaItem {
  k: string;
  v: string;
}

export interface Stat {
  num: string;
  lbl: string;
}

export interface ChainStep {
  n: string;
  title: string;
  text: string;
}

/** A validation-table row. `values` holds one entry (spans the two middle
    columns) or two entries (one per column); `agree` is the last column. */
export interface TableRow {
  label: string;
  values: string[];
  agree: string;
}

export interface Reference {
  authors: string;
  title: string;
  source: string;
  detail: string;
}

export interface Hero {
  crumbLabel: string;
  kicker: string;
  title: string;
  lede: string;
  image: string;
  imageAlt: string;
  primaryLabel: string;
  sampleLabel: string;
}

export interface WhatYouGet {
  heading: string;
  lead: string;
  deliverables: Deliverable[];
}

export interface Aside {
  whoFor: string[];
  meta: MetaItem[];
}

export type Proof =
  | {
      kind: "image";
      eyebrow: string;
      heading: string;
      image: string;
      imageAlt: string;
      tagPill: string;
      legend: { cap: string; left: string; mid: string; right: string };
      captionLead: string;
      caption: string;
    }
  | {
      kind: "chart";
      eyebrow: string;
      heading: string;
      captionLead: string;
      caption: string;
    }
  | {
      kind: "placeholder";
      eyebrow: string;
      heading: string;
      tagPill: string;
      phTitle: string;
      phText: string;
      captionLead: string;
      caption: string;
    };

export interface Methodology {
  heading: string;
  intro: string;
  stats: Stat[];
  chainHeading: string;
  chain: ChainStep[];
  tableHeading: string;
  tableCaption: string;
  tableColumns: string[];
  tableRows: TableRow[];
  refsHeading: string;
  refs: Reference[];
}

export interface EndCTA {
  heading: string;
  text: string;
  price?: { from: string; amt: string; unit: string };
  primaryLabel: string;
  secondaryLabel: string;
}

export interface ServiceDetailContent {
  slug: string;
  name: string;
  hero: Hero;
  whatYouGet: WhatYouGet;
  aside: Aside;
  proof: Proof;
  methodology: Methodology;
  endCTA: EndCTA;
}

const SCREENING: ServiceDetailContent = {
  slug: "screening",
  name: "Screening",
  hero: {
    crumbLabel: "Screening",
    kicker: "Screening · Analysis",
    title: "Find out if your site is moving — and exactly where.",
    lede:
      "A one-time check that turns satellite radar into a clear, shareable " +
      "report. No sensors, no site visit — just the answer.",
    image: deformationImage,
    imageAlt: "Colour interferogram showing ground displacement over a site",
    primaryLabel: "Request a screening",
    sampleLabel: "See a sample result",
  },
  whatYouGet: {
    heading: "A clear verdict on your ground — in plain language",
    lead:
      "You tell us the area and the period of interest. We measure the ground " +
      "movement from the satellite archive and hand back a report you can put " +
      "in front of any stakeholder — no radar expertise required to read it.",
    deliverables: [
      {
        title: "A displacement map of your site",
        text:
          "Colour-coded by movement rate, so you can see at a glance which " +
          "areas are stable and which are not.",
      },
      {
        title: "Movement rates in millimetres per year",
        text:
          "Quantified velocities for the zones that matter, with the " +
          "measurement period and confidence stated.",
      },
      {
        title: "A plain-language findings summary",
        text:
          "What we found, where, and what it likely means — written for " +
          "decision-makers, not specialists.",
      },
      {
        title: "A shareable PDF report",
        text:
          "Ready for boards, insurers and regulators — plus the underlying " +
          "data on request.",
      },
    ],
  },
  aside: {
    whoFor: [
      "Asset owners checking a site before purchase or works",
      "Engineers needing a movement baseline",
      "Insurers and due-diligence teams assessing risk",
      "Anyone with a one-off question: “is this moving?”",
    ],
    meta: [
      { k: "Turnaround", v: "2–3 weeks" },
      { k: "Delivery", v: "PDF + map" },
      { k: "Coverage", v: "Single site" },
      { k: "History", v: "Back to 2015" },
    ],
  },
  proof: {
    kind: "image",
    eyebrow: "Sample result",
    heading: "What a screening actually looks like",
    image: deformationImage,
    imageAlt:
      "Colour displacement interferogram over a real site; concentric fringes mark a subsiding zone",
    tagPill: "Line-of-sight displacement · Sentinel-1",
    legend: {
      cap: "Ground velocity",
      left: "−20 mm/yr (subsidence)",
      mid: "0",
      right: "+20 mm/yr (uplift)",
    },
    captionLead: "Read it like a contour map.",
    caption:
      "Each colour cycle is a fixed amount of movement along the satellite " +
      "line of sight. The tight concentric rings near centre mark a bowl of " +
      "subsidence; the broad uniform field around it is stable ground. Every " +
      "screening report pairs a map like this with the plain-language " +
      "findings above.",
  },
  methodology: {
    heading: "The science behind the verdict",
    intro:
      "Screening is a multi-temporal InSAR analysis over the Copernicus " +
      "Sentinel-1 archive. We measure phase differences between repeat radar " +
      "acquisitions to recover sub-centimetre ground motion, then validate " +
      "against independent ground truth before anything reaches your report.",
    stats: [
      { num: "±1–2 mm/yr", lbl: "Line-of-sight velocity precision on coherent targets" },
      { num: "5–20 m", lbl: "Ground sampling, depending on processing mode" },
      { num: "6–12 days", lbl: "Native satellite revisit across the archive" },
      { num: "2015→", lbl: "Sentinel-1 archive depth for retrospective analysis" },
    ],
    chainHeading: "Processing chain",
    chain: [
      { n: "01", title: "SAR stack", text: "Assemble the Sentinel-1 single-look complex archive over your area." },
      { n: "02", title: "Coregistration", text: "Align every acquisition to sub-pixel precision on a common geometry." },
      { n: "03", title: "Interferograms", text: "Form phase differences and remove topographic and orbital contributions." },
      { n: "04", title: "Unwrapping", text: "Resolve phase ambiguities into continuous displacement fields." },
      { n: "05", title: "Time-series", text: "Invert with SBAS / PSI to recover velocities and deformation history." },
    ],
    tableHeading: "Validation against ground truth",
    tableCaption:
      "Representative cross-validation of HELIOSYN velocities against co-located GNSS stations (line-of-sight projected).",
    tableColumns: ["Metric", "HELIOSYN InSAR", "GNSS reference", "Agreement"],
    tableRows: [
      { label: "Mean velocity (mm/yr)", values: ["−8.4", "−8.7"], agree: "0.3 mm/yr" },
      { label: "RMSE on overlapping points", values: ["1.6 mm/yr"], agree: "within spec" },
      { label: "Temporal correlation (R²)", values: ["0.94"], agree: "strong" },
      { label: "Coherent point density", values: ["4,200 / km²"], agree: "urban scene" },
    ],
    refsHeading: "Selected references",
    refs: [
      { authors: "Ferretti, A., Prati, C., Rocca, F. (2001).", title: "Permanent scatterers in SAR interferometry.", source: "IEEE TGRS", detail: "39(1), 8–20." },
      { authors: "Berardino, P. et al. (2002).", title: "A new algorithm for surface deformation monitoring based on small baseline differential SAR interferograms (SBAS).", source: "IEEE TGRS", detail: "40(11), 2375–2383." },
      { authors: "Crosetto, M. et al. (2016).", title: "Persistent scatterer interferometry: a review.", source: "ISPRS J. Photogramm. Remote Sens.", detail: "115, 78–89." },
      { authors: "Hooper, A. et al. (2007).", title: "Persistent scatterer InSAR for crustal deformation analysis.", source: "JGR Solid Earth", detail: "112, B07407." },
    ],
  },
  endCTA: {
    heading: "Get a screening of your site",
    text:
      "Send us a boundary and a period of interest. We confirm feasibility " +
      "against the archive, then deliver your report.",
    price: { from: "From", amt: "€4,900", unit: "/ site" },
    primaryLabel: "Request a quote",
    secondaryLabel: "Talk to an expert",
  },
};

const MONITORING: ServiceDetailContent = {
  slug: "monitoring",
  name: "Monitoring",
  hero: {
    crumbLabel: "Monitoring",
    kicker: "Monitoring",
    title: "Know the moment your assets start to move.",
    lede:
      "Continuous satellite tracking of your whole network, with automatic " +
      "change alerts the moment movement crosses a threshold you set — " +
      "updated every cycle.",
    image: riskImage,
    imageAlt: "Aerial view of rail and road corridors monitored for movement",
    primaryLabel: "Set up monitoring",
    sampleLabel: "See a sample result",
  },
  whatYouGet: {
    heading: "Always-on watch over your network",
    lead:
      "Once your assets are set up, we process every new satellite pass, " +
      "compare it to the established baseline, and surface anything that " +
      "changes. You don't go looking for movement — it comes to you.",
    deliverables: [
      {
        title: "A live dashboard of every monitored asset",
        text: "Each corridor, structure or zone with its current status, trend and last update.",
      },
      {
        title: "Automatic change alerts",
        text:
          "An email and dashboard flag the moment movement crosses a " +
          "threshold you define — no manual review needed.",
      },
      {
        title: "Trend charts updated every cycle",
        text: "Displacement history per point, refreshed with each Sentinel-1 acquisition.",
      },
      {
        title: "Periodic reporting",
        text: "Scheduled summaries for maintenance planning, boards and regulators.",
      },
    ],
  },
  aside: {
    whoFor: [
      "Rail, road and bridge operators",
      "Utilities, pipelines and dam owners",
      "Mine operators managing active ground",
      "Teams responsible for a network, not a single site",
    ],
    meta: [
      { k: "Update cadence", v: "6–12 days" },
      { k: "Alerts", v: "Email + dashboard" },
      { k: "Coverage", v: "Networks" },
      { k: "Setup", v: "2–4 weeks" },
    ],
  },
  proof: {
    kind: "chart",
    eyebrow: "Sample result",
    heading: "A change alert, the moment it fires",
    captionLead: "Stable, then not.",
    caption:
      "The point held steady through spring, then began a steady descent. " +
      "The instant the trend crossed your −12 mm threshold, an alert was " +
      "raised — automatically, the same day the acquisition was processed. " +
      "Every monitored point carries a trace like this on your live dashboard.",
  },
  methodology: {
    heading: "How continuous detection works",
    intro:
      "Monitoring runs the same multi-temporal InSAR measurement as a " +
      "screening, but on a schedule. Each new Sentinel-1 acquisition is " +
      "appended to the stack, the time-series is re-inverted, and every " +
      "monitored point is tested against its alert rule before the next pass " +
      "arrives.",
    stats: [
      { num: "6–12 days", lbl: "Update cadence, matching satellite revisit" },
      { num: "< 48 h", lbl: "From acquisition to processed alert" },
      { num: "±1–2 mm/yr", lbl: "Velocity precision on coherent targets" },
      { num: "10³–10⁴/km²", lbl: "Monitored point density in urban scenes" },
    ],
    chainHeading: "Monitoring cycle",
    chain: [
      { n: "01", title: "New acquisition", text: "Each Sentinel-1 pass over your network is ingested automatically." },
      { n: "02", title: "Append & reprocess", text: "Add to the stack and re-invert the deformation time-series." },
      { n: "03", title: "Baseline compare", text: "Test each point against its established trend and alert rule." },
      { n: "04", title: "Alert", text: "Threshold breaches raise an email and dashboard flag within 48 h." },
      { n: "05", title: "Dashboard update", text: "Charts, statuses and reports refresh for the whole network." },
    ],
    tableHeading: "Detection performance",
    tableCaption:
      "Representative detection characteristics against co-located GNSS and levelling references.",
    tableColumns: ["Metric", "HELIOSYN monitoring", "Reference", "Result"],
    tableRows: [
      { label: "Smallest reliably detected trend", values: ["≈ 3 mm/yr over one season"], agree: "sub-threshold" },
      { label: "Velocity agreement vs GNSS (RMSE)", values: ["1.6 mm/yr"], agree: "within spec" },
      { label: "False-alarm rate at recommended thresholds", values: ["< 2%"], agree: "low" },
      { label: "Median alert latency", values: ["31 h after acquisition"], agree: "< 48 h" },
    ],
    refsHeading: "Selected references",
    refs: [
      { authors: "Torres, R. et al. (2012).", title: "GMES Sentinel-1 mission.", source: "Remote Sensing of Environment", detail: "120, 9–24." },
      { authors: "Berardino, P. et al. (2002).", title: "A new algorithm for surface deformation monitoring based on SBAS interferograms.", source: "IEEE TGRS", detail: "40(11), 2375–2383." },
      { authors: "Crosetto, M. et al. (2016).", title: "Persistent scatterer interferometry: a review.", source: "ISPRS J. Photogramm. Remote Sens.", detail: "115, 78–89." },
      { authors: "Ferretti, A., Prati, C., Rocca, F. (2001).", title: "Permanent scatterers in SAR interferometry.", source: "IEEE TGRS", detail: "39(1), 8–20." },
    ],
  },
  endCTA: {
    heading: "Put your network under continuous watch",
    text:
      "Share the assets you need covered and the thresholds that matter. We " +
      "scope the network, set up monitoring, and your dashboard goes live.",
    price: { from: "From", amt: "€1,200", unit: "/ month" },
    primaryLabel: "Request a quote",
    secondaryLabel: "Talk to an expert",
  },
};

const RESEARCH: ServiceDetailContent = {
  slug: "research-collaboration",
  name: "Research & Collaboration",
  hero: {
    crumbLabel: "Scientific Analytics",
    kicker: "Science",
    title: "Answer the questions a standard product can't.",
    lede:
      "Bespoke studies and scientific partnerships built on satellite-based " +
      "measurement of ground movement — scoped around your research question, " +
      "not a fixed deliverable.",
    image: researchImage,
    imageAlt: "Earth-observation satellite in orbit",
    primaryLabel: "Start a conversation",
    sampleLabel: "See an example study",
  },
  whatYouGet: {
    heading: "A research partner, not a data feed",
    lead:
      "We work alongside your team to design the analysis, push the method " +
      "where it needs to go, and produce results that stand up to peer " +
      "review. Engagements range from a single focused investigation to a " +
      "multi-year collaboration.",
    deliverables: [
      {
        title: "A study designed around your question",
        text: "We scope the method, data and validation strategy with you before any processing begins.",
      },
      {
        title: "Custom and advanced processing",
        text:
          "Multi-sensor fusion, atmospheric correction, decomposition of " +
          "vertical and horizontal motion, and methods tailored to hard scenes.",
      },
      {
        title: "Documented, reproducible results",
        text: "Methods, uncertainties and data provenance written up to a standard you can publish or submit.",
      },
      {
        title: "Co-authorship & ongoing collaboration",
        text: "Joint publications, grant support and a standing relationship with our science team.",
      },
    ],
  },
  aside: {
    whoFor: [
      "Universities and research institutes",
      "Geological surveys and public agencies",
      "Consultancies needing defensible analysis",
      "Anyone with a question beyond a standard product",
    ],
    meta: [
      { k: "Engagement", v: "Project → multi-year" },
      { k: "Output", v: "Study + data" },
      { k: "Method", v: "Bespoke" },
      { k: "IP", v: "Negotiable" },
    ],
  },
  proof: {
    kind: "placeholder",
    eyebrow: "Example study",
    heading: "Decomposing a deforming basin",
    tagPill: "Multi-track InSAR · ascending + descending",
    phTitle: "Figure placeholder",
    phText: "Vertical / horizontal velocity decomposition · drop in the published study figure",
    captionLead: "From one line of sight to true 3-D motion.",
    caption:
      "By combining ascending and descending satellite tracks, a bespoke " +
      "study separates vertical settlement from horizontal creep across a " +
      "basin — a result no single off-the-shelf product delivers. We'll " +
      "replace this frame with the figure from your engagement.",
  },
  methodology: {
    heading: "Methods we bring to a study",
    intro:
      "Every engagement starts from the same validated InSAR core, then " +
      "extends it. The toolkit below is selected and tuned per project, and " +
      "every result ships with a documented uncertainty budget.",
    stats: [
      { num: "2 tracks", lbl: "Ascending + descending for 2-D / 3-D decomposition" },
      { num: "±1 mm/yr", lbl: "Achievable velocity precision on strong scatterers" },
      { num: "Multi-sensor", lbl: "Sentinel-1, plus high-resolution & archival SAR" },
      { num: "Peer-ready", lbl: "Documented to publication / submission standard" },
    ],
    chainHeading: "Study workflow",
    chain: [
      { n: "01", title: "Scope", text: "Define the research question, hypotheses and validation plan with your team." },
      { n: "02", title: "Data & method", text: "Select sensors, tracks and the processing approach the question demands." },
      { n: "03", title: "Advanced processing", text: "Atmospheric correction, decomposition and multi-sensor fusion as needed." },
      { n: "04", title: "Validation", text: "Cross-check against GNSS, levelling or independent campaigns." },
      { n: "05", title: "Write-up", text: "Reproducible methods, uncertainties and figures — ready to publish." },
    ],
    tableHeading: "Capabilities & provenance",
    tableCaption:
      "Representative methods applied in scientific engagements, with the rigour each carries.",
    tableColumns: ["Capability", "Approach", "Typical use", "Rigour"],
    tableRows: [
      { label: "2-D / 3-D decomposition", values: ["Asc + desc track inversion", "Separate vertical vs horizontal motion"], agree: "peer-reviewed method" },
      { label: "Atmospheric correction", values: ["Weather-model + empirical", "Low-rate signals over large areas"], agree: "documented" },
      { label: "Multi-sensor fusion", values: ["Sentinel-1 + high-res SAR", "Fine-scale or historical context"], agree: "validated" },
      { label: "Uncertainty budget", values: ["Per-point error propagation", "Every delivered velocity field"], agree: "standard" },
    ],
    refsHeading: "Selected references",
    refs: [
      { authors: "Wright, T. J. et al. (2004).", title: "Toward mapping surface deformation in three dimensions using InSAR.", source: "Geophys. Res. Lett.", detail: "31, L01607." },
      { authors: "Hooper, A. et al. (2012).", title: "Recent advances in SAR interferometry time-series analysis for measuring crustal deformation.", source: "Tectonophysics", detail: "514–517, 1–13." },
      { authors: "Bekaert, D. P. S. et al. (2015).", title: "Statistical comparison of InSAR tropospheric correction techniques.", source: "Remote Sens. Environ.", detail: "170, 40–47." },
      { authors: "Crosetto, M. et al. (2016).", title: "Persistent scatterer interferometry: a review.", source: "ISPRS J. Photogramm. Remote Sens.", detail: "115, 78–89." },
    ],
  },
  endCTA: {
    heading: "Have a question worth investigating?",
    text:
      "Scientific engagements are scoped individually — there's no standard " +
      "price because there's no standard study. Tell us what you're trying to " +
      "find out and we'll shape an approach together.",
    primaryLabel: "Contact us",
    secondaryLabel: "Email the science team",
  },
};

const DETAIL_CONTENT: Record<string, ServiceDetailContent> = {
  screening: SCREENING,
  monitoring: MONITORING,
  "research-collaboration": RESEARCH,
};

export function getServiceDetailContent(
  slug: string,
): ServiceDetailContent | undefined {
  return DETAIL_CONTENT[slug];
}
