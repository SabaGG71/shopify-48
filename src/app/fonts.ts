import localFont from "next/font/local"
import { Anton, Fraunces, Fredoka, Instrument_Serif } from "next/font/google"

/* Display: Cabinet Grotesk (bold, with character). Body: General Sans. Both Fontshare, free for commercial use. */
export const ivy = localFont({
  src: [
    { path: "./fonts/cabinet-grotesk-500.woff2", weight: "500" },
    { path: "./fonts/cabinet-grotesk-700.woff2", weight: "700" },
    { path: "./fonts/cabinet-grotesk-800.woff2", weight: "800" },
    { path: "./fonts/cabinet-grotesk-900.woff2", weight: "900" },
  ],
  variable: "--font-ivy",
  display: "swap",
  fallback: ["Arial Black", "Helvetica", "sans-serif"],
})

export const manrope = localFont({
  src: [
    { path: "./fonts/general-sans-400.woff2", weight: "400" },
    { path: "./fonts/general-sans-500.woff2", weight: "500" },
    { path: "./fonts/general-sans-600.woff2", weight: "600" },
  ],
  variable: "--font-manrope",
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
})

/* Faces used only inside the five style previews. Not preloaded: they are not on the critical path. */
export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap", preload: false })
export const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  preload: false,
})
export const fredoka = Fredoka({ weight: "variable", subsets: ["latin"], variable: "--font-fredoka", display: "swap", preload: false })
export const fraunces = Fraunces({
  weight: "variable",
  axes: ["SOFT", "opsz"],
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
})

export const fontVariables = [ivy, manrope, anton, instrumentSerif, fredoka, fraunces].map((f) => f.variable).join(" ")
