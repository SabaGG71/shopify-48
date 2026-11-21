import type { Metadata } from "next"
import { NotAFitView } from "@/components/funnel/views"
import "../d1.css"

export const metadata: Metadata = { title: "Not a fit right now | LocalEyes", robots: { index: false, follow: false } }

export default function DemoNotAFitPage() {
  return <NotAFitView theme="demo" />
}
