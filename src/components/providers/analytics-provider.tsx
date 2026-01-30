"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePublicSettings } from "@/hooks/use-settings";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = usePublicSettings();

  const trackingType = settings?.tracking_type;
  const gtmContainerId = settings?.gtm_container_id;
  const ga4MeasurementId = settings?.ga4_measurement_id;
  const enableGtmDebug = settings?.enable_gtm_debug === "true";

  useEffect(() => {
    if (trackingType === "gtm" && gtmContainerId) {
      // Initialize GTM dataLayer
      window.dataLayer = window.dataLayer || [];
      if (enableGtmDebug) {
        console.log("[GTM] Initialized with container:", gtmContainerId);
      }
    }
  }, [trackingType, gtmContainerId, enableGtmDebug]);

  return (
    <>
      {/* Google Tag Manager */}
      {trackingType === "gtm" && gtmContainerId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmContainerId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics 4 (standalone) */}
      {trackingType === "ga4" && ga4MeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4MeasurementId}');
              `,
            }}
          />
        </>
      )}

      {children}
    </>
  );
}

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
