/**
 * MatrimonyOS Central Constants
 * Global privacy-first matrimonial matchmaking platform
 */

export const APP_CONFIG = {
  name: "MatrimonyOS",
  tagline: "A More Meaningful Way to Find Your Life Partner",
  description:
    "A global, privacy-first matrimonial matchmaking platform for individuals and families seeking meaningful, verified connections.",
  version: "0.2.0",
  phase: "Day 1, Phase 2 — Premium Public Website & Complete Design System",
  supportEmail: "support@matrimonyos.com",
  inquiriesEmail: "concierge@matrimonyos.com",
  contactAddress: "London • New York • Dhaka • Toronto • Dubai",
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Success Stories", href: "/success-stories" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
] as const;

export const FOOTER_LINKS = {
  platform: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Membership Plans", href: "/pricing" },
    { label: "Success Stories", href: "/success-stories" },
    { label: "Demonstration Profiles", href: "/#demo-profiles" },
    { label: "Editorial Journal", href: "/blog" },
  ],
  company: [
    { label: "About MatrimonyOS", href: "/about" },
    { label: "Privacy Philosophy", href: "/about#privacy-philosophy" },
    { label: "Global Corridors", href: "/about#corridors" },
    { label: "Contact & Support", href: "/contact" },
    { label: "System Status", href: "/api/health" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Frequently Asked Questions", href: "/faq" },
  ],
} as const;

export const SUPPORTED_REGIONS = [
  {
    code: "BD",
    name: "Bangladesh",
    hub: "Dhaka",
    currency: "BDT",
    locale: "bn-BD",
  },
  {
    code: "GB",
    name: "United Kingdom",
    hub: "London",
    currency: "GBP",
    locale: "en-GB",
  },
  {
    code: "US",
    name: "United States",
    hub: "New York",
    currency: "USD",
    locale: "en-US",
  },
  {
    code: "CA",
    name: "Canada",
    hub: "Toronto",
    currency: "CAD",
    locale: "en-CA",
  },
  {
    code: "EU",
    name: "Europe",
    hub: "Frankfurt",
    currency: "EUR",
    locale: "en-EU",
  },
  {
    code: "ME",
    name: "Middle East",
    hub: "Dubai",
    currency: "USD",
    locale: "en-ME",
  },
] as const;

export const BRAND_COLORS = {
  navy: "#14243A",
  midnight: "#0B1728",
  ivory: "#FAF8F3",
  white: "#FFFFFF",
  gold: "#B89A63",
  goldHover: "#A3854F",
  beige: "#EEE8DC",
  charcoal: "#333333",
  mutedGray: "#777777",
} as const;
