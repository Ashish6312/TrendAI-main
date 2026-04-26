import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import ScrollToTop from "@/components/ScrollToTop";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "Startup Scope | AI-Powered Business Intelligence",
  description: "Using AI to analyze global trends and community feedback to help you build successful businesses.",
  manifest: "/manifest.json",
  icons: {
    icon: "/brand-logo-v3.png",
    shortcut: "/brand-logo-v3.png",
    apple: "/brand-logo-v3.png",
  }
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased min-h-screen flex flex-col scroll-smooth`}>
        <div className="bg-glow" />
        <div className="bg-noise fixed inset-0 z-[-1] pointer-events-none" />
        <ClientProviders>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <ScrollToTop />
        </ClientProviders>
      </body>
    </html>
  );
}
