import type { Metadata } from "next"
import { BookPage } from "@/components/book/book-page"
import "../d1.css"

export const metadata: Metadata = {
  title: "Book your homepage call | LocalEyes",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <BookPage theme="demo" />
}
