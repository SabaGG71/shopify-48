import type { Metadata } from "next"
import { BookPage } from "@/components/book/book-page"
import "@/app/(home)/demo.css"

export const metadata: Metadata = {
  title: "Book your homepage call | LocalEyes",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <BookPage theme="home" />
}
