import type { Metadata } from "next"
import { ThanksView } from "@/components/funnel/views"
import "../d1.css"

export const metadata: Metadata = { title: "Application received | LocalEyes", robots: { index: false, follow: false } }

export default function DemoThanksPage() {
  return <ThanksView theme="demo" />
}
