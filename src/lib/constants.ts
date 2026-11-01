/**
 * MatrimonyOS Central Constants
 * Global privacy-first matrimonial matchmaking platform
 */

export const APP_CONFIG = {
  name: "MatrimonyOS",
  tagline: "Privacy-First Global Matrimonial Matchmaking",
  description:
    "An international, privacy-first matchmaking platform connecting conscious individuals and families across Bangladesh, UK, USA, Canada, Europe, Middle East, and beyond.",
  version: "0.1.0",
  phase: "Day 1 - Foundation & Architecture",
  supportEmail: "support@matrimonyos.com",
} as const;

export const SUPPORTED_REGIONS = [
  { code: "BD", name: "Bangladesh", currency: "BDT", locale: "bn-BD" },
  { code: "GB", name: "United Kingdom", currency: "GBP", locale: "en-GB" },
  { code: "US", name: "United States", currency: "USD", locale: "en-US" },
  { code: "CA", name: "Canada", currency: "CAD", locale: "en-CA" },
  { code: "EU", name: "Europe", currency: "EUR", locale: "en-EU" },
  { code: "ME", name: "Middle East", currency: "USD", locale: "en-ME" },
] as const;

export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const BRAND_COLORS = {
  navy: {
    DEFAULT: "#0F172A",
    deep: "#090D16",
    surface: "#1E293B",
  },
  ivory: {
    DEFAULT: "#FAF9F6",
    light: "#FFFFFF",
    muted: "#F4F1EA",
  },
  gold: {
    DEFAULT: "#C5A059",
    hover: "#B38F46",
    subtle: "#DFD2BA",
  },
} as const;
