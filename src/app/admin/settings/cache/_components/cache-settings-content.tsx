"use client";

import { useState, useEffect } from "react";
import { Database, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export function CacheSettingsContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Simulated fetch settings (if needed for other features)
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        toast.error("Failed to load performance settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to clear all cache? This will clear cookies, localStorage, sessionStorage, and reload the page.")) {
      return;
    }

    setIsClearing(true);
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear cache storage (if supported)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      toast.success("Cache cleared successfully. Page will reload...");
      
      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error("Failed to clear cache");
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12" />
          <p className="text-sm text-muted-foreground">Loading performance settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlay - Shows when clearing */}
      {isClearing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg shadow-lg border">
            <Spinner className="h-12 w-12" />
            <p className="text-sm font-medium">Clearing cache...</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Performance</h1>
          <p className="text-muted-foreground mt-1">
            Optimize your application performance and caching
          </p>
        </div>

        {/* Cache Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Cache</CardTitle>
                <CardDescription>
                  Clear browser cache, cookies, and local storage
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Clear All Cache</p>
              <p className="text-xs text-muted-foreground">
                This will clear:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Browser cookies</li>
                <li>Local storage data</li>
                <li>Session storage data</li>
                <li>Cache storage</li>
              </ul>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 font-medium mt-2">
                ⚠️ Warning: You will be logged out and the page will reload.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                variant="destructive"
                onClick={handleClearCache}
                disabled={isClearing}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isClearing ? "Clearing..." : "Clear All Cache"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Optimization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Optimization
              </CardTitle>
              <CardDescription>
                Optimize database queries and connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Optimize Tables
              </Button>
            </CardContent>
          </Card>

          {/* Static Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Static Assets
              </CardTitle>
              <CardDescription>
                Manage static file caching and CDN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Asset Cache
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}