import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_CONFIG } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_CONFIG.name} — ${APP_CONFIG.tagline}`,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: [
    "Matrimony",
    "Privacy-first matchmaking",
    "Global matrimony",
    "Bangladesh matrimony",
    "UK matrimony",
    "USA matrimony",
    "Halal matchmaking",
    "SaaS matrimony",
  ],
  authors: [{ name: "MatrimonyOS Team" }],
  openGraph: {
    title: `${APP_CONFIG.name} — ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#FAF9F6] text-[#0F172A] selection:bg-[#C5A059] selection:text-[#0F172A]">
        {children}
      </body>
    </html>
  );
}
