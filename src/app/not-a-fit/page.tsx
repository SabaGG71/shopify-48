import type { Metadata } from "next"
import { NotAFitView } from "@/components/funnel/views"
import "@/app/(home)/demo.css"

export const metadata: Metadata = { title: "Not a fit right now | LocalEyes", robots: { index: false, follow: false } }

export default function NotAFitPage() {
  return <NotAFitView theme="home" />
}
