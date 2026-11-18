import localFont from "next/font/local"
import { Anton, Fraunces, Fredoka, Instrument_Serif } from "next/font/google"

/* Brand */
export const ivy = localFont({
  src: "./fonts/ivy-presto-headline-thin.woff2",
  variable: "--font-ivy",
  weight: "400",
  display: "swap",
  fallback: ["Georgia", "serif"],
})

export const manrope = localFont({
  src: [
    { path: "./fonts/manrope-latin-300-normal.woff2", weight: "300" },
    { path: "./fonts/manrope-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/manrope-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/manrope-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/manrope-latin-700-normal.woff2", weight: "700" },
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
