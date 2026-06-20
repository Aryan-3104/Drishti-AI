import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import OperationalTicker from "@/components/OperationalTicker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "ParkGuard — Parking Enforcement Command Center",
  description: "Operational intelligence for predictive parking enforcement across Bengaluru.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${jetbrains.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-navy-950 text-ink font-sans">
        <Navbar />
        <OperationalTicker />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
