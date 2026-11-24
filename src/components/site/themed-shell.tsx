import { demoBody, demoDisplay } from "@/app/(home)/fonts"
import { DContainer, DemoFooter, DemoHeader } from "@/components/demo/demo-sections"
import { DemoLink } from "@/components/demo/demo-ui"
import { getConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

/**
 * The site's one design, the light blue "/" page, shared by the pages after the apply form.
 * Each route file imports "@/app/(home)/demo.css". The lime /demo page was removed on 2026-11-24;
 * /demo links now redirect to "/" (next.config.ts).
 */
export type SiteTheme = "home"

/** Path prefix for the pages after the form. */
export const basePathFor = (_theme: SiteTheme) => ""
export const homeHrefFor = (_theme: SiteTheme) => "/"
export const applyHrefFor = (_theme: SiteTheme) => "/#apply-top"

export async function ThemedShell({
  theme,
  children,
  showApply = false,
  mainClassName,
}: {
  theme: SiteTheme
  children: React.ReactNode
  showApply?: boolean
  mainClassName?: string
}) {
  const config = await getConfig()
  return (
    <div className={cn(demoDisplay.variable, demoBody.variable, "demo-root flex min-h-dvh flex-col")}>
      <DemoHeader config={config} applyHref={applyHrefFor(theme)} showApply={showApply} />
      <main id="main" className={cn("flex-1", mainClassName)}>
        {children}
      </main>
      <DemoFooter kentNumber={config.KENT_TEXT_NUMBER} />
    </div>
  )
}

export function ThemedContainer({ className, children }: { theme: SiteTheme; className?: string; children: React.ReactNode }) {
  return <DContainer className={className}>{children}</DContainer>
}

/** A small label over a big title. */
export function ThemedTitle({ label, title, as = "h1" }: { theme: SiteTheme; label: string; title: React.ReactNode; as?: "h1" | "h2" }) {
  const Heading = as
  return (
    <>
      <p className="d-kicker">{label}</p>
      <Heading className="d-display mt-4 max-w-[18ch] text-[2.55rem] text-balance text-ink sm:text-[3.8rem]">{title}</Heading>
    </>
  )
}

/** The main button, as a link. */
export function ThemedButtonLink({ href, children, className }: { theme: SiteTheme; href: string; children: React.ReactNode; className?: string }) {
  return (
    <DemoLink href={href} className={className}>
      {children}
    </DemoLink>
  )
}

/** An inline text link. */
export const textLinkClass = (_theme: SiteTheme) => "font-bold text-gold underline decoration-2 underline-offset-4 hover:text-ink"
