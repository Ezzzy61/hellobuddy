// ============================================================================
// Country-specific crisis/emergency resources shown by the self-harm safety
// response (see src/lib/ai/prompts.ts -> buildCrisisResponse). Keeping this
// separate from the prompt text makes it easy to add more countries without
// touching the AI-facing code.
//
// This list is deliberately small and curated rather than exhaustive — a
// country not listed here falls back to a generic response that points to
// findahelpline.com rather than showing a wrong or irrelevant number.
// ============================================================================

export interface CrisisResource {
  countryName: string;
  lines: string[];
}

export const CRISIS_RESOURCES: Record<string, CrisisResource> = {
  IN: {
    countryName: "India",
    lines: [
      "Call 112 — India's national emergency number",
      "Call or text 9152987821 — AASRA, a 24/7 suicide-prevention helpline",
      "Call 1800-599-0019 — KIRAN, the government's 24/7 mental health helpline (toll-free)",
    ],
  },
  US: {
    countryName: "the US",
    lines: ["Call 911 — emergency services", "Call or text 988 — the Suicide & Crisis Lifeline (24/7)"],
  },
  GB: {
    countryName: "the UK",
    lines: ["Call 999 — emergency services", "Call 116 123 — Samaritans (free, 24/7)"],
  },
  CA: {
    countryName: "Canada",
    lines: ["Call 911 — emergency services", "Call or text 988 — Suicide Crisis Helpline (24/7)"],
  },
  AU: {
    countryName: "Australia",
    lines: ["Call 000 — emergency services", "Call 13 11 14 — Lifeline Australia (24/7)"],
  },
  IE: {
    countryName: "Ireland",
    lines: ["Call 112 or 999 — emergency services", "Call 116 123 — Samaritans (free, 24/7)"],
  },
  NZ: {
    countryName: "New Zealand",
    lines: ["Call 111 — emergency services", "Call or text 1737 — Need to Talk? (24/7)"],
  },
  SG: {
    countryName: "Singapore",
    lines: ["Call 999 — emergency services", "Call 1771 (or 6669-1771 by SMS) — Samaritans of Singapore (24/7)"],
  },
  AE: {
    countryName: "the UAE",
    lines: ["Call 999 — emergency services", "Call 800-HOPE (800-4673) — UAE mental health support line"],
  },
};

export const GENERIC_CRISIS_RESOURCE: CrisisResource = {
  countryName: "your country",
  lines: [
    "Contact your local emergency number right now",
    "Find a crisis line for your country at https://findahelpline.com/",
  ],
};

/** Looks up crisis resources by ISO 3166-1 alpha-2 country code, falling back to a generic international pointer. */
export function getCrisisResources(countryCode?: string | null): CrisisResource {
  if (!countryCode) return GENERIC_CRISIS_RESOURCE;
  return CRISIS_RESOURCES[countryCode.trim().toUpperCase()] ?? GENERIC_CRISIS_RESOURCE;
}

/** Small curated country list for onboarding/settings pickers. "" (empty) means "prefer not to say / not listed". */
export const COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "IE", label: "Ireland" },
  { code: "NZ", label: "New Zealand" },
  { code: "SG", label: "Singapore" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "", label: "Other / prefer not to say" },
];
