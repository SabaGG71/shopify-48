import type { Metadata } from "next"
import { ThanksView } from "@/components/funnel/views"
import "@/app/(home)/demo.css"

export const metadata: Metadata = { title: "Application received | LocalEyes", robots: { index: false, follow: false } }

/** Shown to applications flagged for Kent to review by hand (coffee, something else, unverified store). */
export default function ThanksPage() {
  return <ThanksView theme="home" />
}
