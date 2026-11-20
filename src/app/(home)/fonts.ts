import { Gabarito, Onest } from "next/font/google"

/* /demo only. Gabarito: chunky, friendly geometric headlines. Onest: clean text. */
export const demoDisplay = Gabarito({ subsets: ["latin"], variable: "--font-demo-display", display: "swap" })
export const demoBody = Onest({ subsets: ["latin"], variable: "--font-demo-body", display: "swap" })
