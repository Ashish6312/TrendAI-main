"use client";

import AuthProvider from "./AuthProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { SearchProvider } from "@/context/SearchContext";
import { ThemeProvider } from "next-themes";

import { FallbacksErrorBoundary, GlobalOfflineDetection } from "./GlobalFallbacks";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
      <FallbacksErrorBoundary>
        <AuthProvider>
          <LanguageProvider>
            <SubscriptionProvider>
              <SearchProvider>
                <NotificationProvider>
                              <GlobalOfflineDetection />
                  {children}
                </NotificationProvider>
              </SearchProvider>
            </SubscriptionProvider>
          </LanguageProvider>
        </AuthProvider>
      </FallbacksErrorBoundary>
    </ThemeProvider>
  );
}
