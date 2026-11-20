import localFont from "next/font/local"
import { Fragment_Mono } from "next/font/google"

/* /demo-1 only. Satoshi (Fontshare, free for commercial use): modern grotesk for
   headlines and text. Fragment Mono: labels, numbers, the store index. */
export const d1Sans = localFont({
  src: [
    { path: "../fonts/satoshi-500.woff2", weight: "500" },
    { path: "../fonts/satoshi-700.woff2", weight: "700" },
    { path: "../fonts/satoshi-900.woff2", weight: "900" },
  ],
  variable: "--font-d1-sans",
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
})
export const d1Mono = Fragment_Mono({ subsets: ["latin"], weight: "400", variable: "--font-d1-mono", display: "swap" })
