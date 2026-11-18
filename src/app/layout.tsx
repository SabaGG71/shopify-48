import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Suspense } from "react"
import { PixelPageViews } from "@/components/site/pixel-page-views"
import { fontVariables } from "./fonts"
import "./globals.css"

const SITE_URL = process.env.SITE_URL || "http://localhost:3000"
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Your Shopify store, rebuilt in 48 hours | LocalEyes",
  description:
    "LocalEyes rebuilds Shopify stores for food and drink brands in 48 hours. Apply in two minutes. If you qualify, your homepage is rebuilt free.",
  openGraph: {
    title: "Your Shopify store, rebuilt in 48 hours",
    description: "Free homepage rebuild if you qualify. Apply in two minutes.",
    siteName: "LocalEyes",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  themeColor: "#f7f5ec",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-ink px-5 py-3 text-[0.75rem] font-semibold tracking-[0.18em] text-page uppercase focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
        {PIXEL_ID ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');`}
            </Script>
            <Suspense fallback={null}>
              <PixelPageViews />
            </Suspense>
          </>
        ) : null}
      </body>
    </html>
  )
}
