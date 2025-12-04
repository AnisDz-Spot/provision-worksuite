"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";
import { TimeTrackerProvider } from "@/components/timetracking/TimeTrackingWidget";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { TeamChat } from "@/components/team/TeamChat";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { AppLoader } from "@/components/ui/AppLoader";
import { cn } from "@/lib/utils";
import { shouldUseMockData } from "@/lib/dataSource";
import { isDatabaseConfigured } from "@/lib/setup";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            <SettingsProvider>
              <AuthProvider>
                <SidebarProvider>
                  <TimeTrackerProvider>
                    <MainLayout>{children}</MainLayout>
                  </TimeTrackerProvider>
                </SidebarProvider>
              </AuthProvider>
            </SettingsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Show auth pages without any layout
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <Sidebar />
      <MainContent>{children}</MainContent>
    </div>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to login if not authenticated and not on auth pages
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !pathname.startsWith("/auth")) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Redirect users in dummy mode with no DB config to DB setup page
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (shouldUseMockData() && !isDatabaseConfigured()) {
        if (pathname !== "/settings/database") {
          router.push("/settings/database");
        }
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return <AppLoader />;
  }

  // Don't render main app until authenticated
  if (!isAuthenticated) {
    return <AppLoader />;
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        collapsed ? "ml-16" : "ml-60"
      )}
    >
      <Navbar />
      <main className="flex-1 bg-background text-foreground">{children}</main>
      <ScrollToTop />
      {currentUser && <TeamChat currentUser={currentUser.name} />}
    </div>
  );
}
