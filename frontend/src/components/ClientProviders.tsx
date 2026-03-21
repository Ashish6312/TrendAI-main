"use client";

import AuthProvider from "./AuthProvider";
import LoginTracker from "./LoginTracker";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { AnimationProvider } from "@/context/AnimationContext";
import { ThemeProvider } from "next-themes";

import { GlobalErrorBoundary, GlobalOfflineDetection } from "./GlobalFallbacks";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <GlobalErrorBoundary>
        <AuthProvider>
          <LanguageProvider>
            <SubscriptionProvider>
              <AnimationProvider>
                <NotificationProvider>
                  <LoginTracker />
                  <GlobalOfflineDetection />
                  {children}
                </NotificationProvider>
              </AnimationProvider>
            </SubscriptionProvider>
          </LanguageProvider>
        </AuthProvider>
      </GlobalErrorBoundary>
    </ThemeProvider>
  );
}
