"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Pages that should not show navbar and footer
  const noLayoutPages = ['/auth'];
  
  const shouldShowLayout = !noLayoutPages.includes(pathname);

  if (!shouldShowLayout) {
    // For auth page, render children without navbar/footer and without padding
    return (
      <main className="flex-1 w-full">
        {children}
      </main>
    );
  }

  // For all other pages, render with navbar and global footer
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-14 sm:pt-16 lg:pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}