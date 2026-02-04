"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import AdminNavbar from "@/components/layout/navbar";
import AdminFooter from "@/components/layout/footer";
import { TopHeader } from "@/components/layout/top-header";
import Breadcrumb from "@/components/layout/breadcrumb";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import { DynamicHead } from "@/components/providers/dynamic-head";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = localStorage.getItem("authenticated");

        if (!authenticated) {
          setTimeout(() => {
            setIsLoading(false);
            setIsAuthorized(true);
          }, 500);
        } else {
          setIsAuthorized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <AppearanceProvider>
      <DynamicHead />
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main Content */}
          <SidebarInset className="flex flex-col flex-1">
            {/* Top Header with Language, Currency, Theme */}
            <TopHeader />

            {/* Navbar */}
            <AdminNavbar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-6">
                <Breadcrumb />
                {children}
              </div>
            </main>

            {/* Footer */}
            <AdminFooter />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppearanceProvider>
  );
}
