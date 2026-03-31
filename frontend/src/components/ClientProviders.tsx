"use client";

import AuthProvider from "./AuthProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { SearchProvider } from "@/context/SearchContext";
import { ThemeProvider } from "next-themes";

import { GlobalErrorBoundary, GlobalOfflineDetection } from "./GlobalFallbacks";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <GlobalErrorBoundary>
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
      </GlobalErrorBoundary>
    </ThemeProvider>
  );
}
