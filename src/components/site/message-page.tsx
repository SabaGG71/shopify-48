import { LabelRule, Ornament } from "@/components/brand/marks"
import { Container } from "@/components/landing/sections"
import { SiteFooter, SiteHeader } from "@/components/site/chrome"

/** Simple centred message page in the brand style. */
export function MessagePage({
  label,
  title,
  children,
  kentNumber,
}: {
  label: string
  title: React.ReactNode
  children: React.ReactNode
  kentNumber?: string
}) {
  return (
    <>
      <SiteHeader showApply={false} />
      <main id="main" className="flex-1 pt-6 pb-24 sm:pt-16">
        <Container className="max-w-[760px]">
          <LabelRule>
            <Ornament /> {label}
          </LabelRule>
          <h1 className="display mt-6 text-[2.6rem] text-balance text-ink sm:text-[3.8rem]">{title}</h1>
          <div className="mt-6 grid gap-4 text-[1rem] leading-relaxed text-soft">{children}</div>
        </Container>
      </main>
      <SiteFooter kentNumber={kentNumber} />
    </>
  )
}
