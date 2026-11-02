import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import { APP_CONFIG } from "@/lib/constants";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_CONFIG.name} — A More Meaningful Way to Find Your Life Partner`,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description:
    "A global, privacy-first matrimonial matchmaking platform for individuals and families seeking meaningful, verified connections across Bangladesh, UK, USA, Canada, Europe, Middle East, and beyond.",
  keywords: [
    "MatrimonyOS",
    "Privacy-first matrimony",
    "Global South Asian matrimony",
    "Verified matrimonial platform",
    "Halal matchmaking",
    "Bangladeshi matrimony UK USA Canada",
    "Confidential matchmaking SaaS",
  ],
  authors: [{ name: "MatrimonyOS Team" }],
  openGraph: {
    title: `${APP_CONFIG.name} — A More Meaningful Way to Find Your Life Partner`,
    description:
      "A global, privacy-first matrimonial matchmaking platform connecting conscious individuals and families.",
    type: "website",
    locale: "en_US",
    siteName: APP_CONFIG.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${playfair.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#FAF8F3] font-sans text-[#333333] selection:bg-[#B89A63] selection:text-[#FAF8F3]">
        {children}
      </body>
    </html>
  );
}
