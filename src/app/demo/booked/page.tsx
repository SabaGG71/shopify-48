import type { Metadata } from "next"
import { BookedPage } from "@/components/book/book-page"
import "../d1.css"

export const metadata: Metadata = { title: "You’re booked | LocalEyes", robots: { index: false, follow: false } }

export default function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <BookedPage theme="demo" searchParams={props.searchParams} />
}
