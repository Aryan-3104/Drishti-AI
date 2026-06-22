import type { Metadata } from "next";
import { Inter, Fraunces, Noto_Sans_Kannada, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import OperationalTicker from "@/components/OperationalTicker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const notoKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  variable: "--font-noto-kannada",
  weight: ["400", "500"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Drishti AI - Bengaluru Traffic Enforcement Intelligence",
  description: "AI-driven parking enforcement intelligence for Bengaluru Traffic Police.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${notoKannada.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-navy-950 text-ink font-sans">
        <Navbar />
        <OperationalTicker />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8">
          <div className="page-transition">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
