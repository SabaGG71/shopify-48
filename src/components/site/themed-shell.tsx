import { demoBody, demoDisplay } from "@/app/(home)/fonts"
import { d1Mono, d1Sans } from "@/app/demo/fonts"
import { DContainer, DemoFooter, DemoHeader } from "@/components/demo/demo-sections"
import { DemoLink } from "@/components/demo/demo-ui"
import { D1Container, D1Footer, D1Header } from "@/components/demo1/sections"
import { D1Link } from "@/components/demo1/ui"
import { getConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

/**
 * The two landing designs: "home" is the light blue "/" page, "demo" the lime "/demo" page.
 * Pages after the apply form wear the design the visitor came from. Each route file imports
 * its design's CSS ("@/app/(home)/demo.css" or "@/app/demo/d1.css"). Both roots define the same
 * token names (ink, gold, paper, cream, line and the font variables), so shared components
 * re-theme by themselves inside either root.
 */
export type SiteTheme = "home" | "demo"

/** Path prefix for a design's pages. */
export const basePathFor = (theme: SiteTheme) => (theme === "demo" ? "/demo" : "")
export const homeHrefFor = (theme: SiteTheme) => (theme === "demo" ? "/demo" : "/")
export const applyHrefFor = (theme: SiteTheme) => (theme === "demo" ? "/demo#apply-top" : "/#apply-top")

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
  if (theme === "demo") {
    return (
      <div className={cn(d1Sans.variable, d1Mono.variable, "d1-root flex min-h-dvh flex-col")}>
        <D1Header config={config} applyHref={applyHrefFor(theme)} showApply={showApply} />
        <main id="main" className={cn("flex-1", mainClassName)}>
          {children}
        </main>
        <D1Footer kentNumber={config.KENT_TEXT_NUMBER} />
      </div>
    )
  }
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

export function ThemedContainer({ theme, className, children }: { theme: SiteTheme; className?: string; children: React.ReactNode }) {
  return theme === "demo" ? <D1Container className={className}>{children}</D1Container> : <DContainer className={className}>{children}</DContainer>
}

/** A small label over a big title, in each design's own type. */
export function ThemedTitle({ theme, label, title, as = "h1" }: { theme: SiteTheme; label: string; title: React.ReactNode; as?: "h1" | "h2" }) {
  const Heading = as
  return (
    <>
      {theme === "demo" ? <p className="d1-mono text-tan">{label}</p> : <p className="d-kicker">{label}</p>}
      <Heading
        className={
          theme === "demo"
            ? "d1-h2 mt-4 max-w-[18ch] text-[2.4rem] text-ink sm:text-[3.4rem]"
            : "d-display mt-4 max-w-[18ch] text-[2.55rem] text-balance text-ink sm:text-[3.8rem]"
        }
      >
        {title}
      </Heading>
    </>
  )
}

/** The design's main button, as a link. */
export function ThemedButtonLink({ theme, href, children, className }: { theme: SiteTheme; href: string; children: React.ReactNode; className?: string }) {
  return theme === "demo" ? (
    <D1Link href={href} className={className}>
      {children}
    </D1Link>
  ) : (
    <DemoLink href={href} className={className}>
      {children}
    </DemoLink>
  )
}

/** An inline text link in the design's style. */
export const textLinkClass = (theme: SiteTheme) =>
  theme === "demo" ? "d1-link font-semibold text-ink" : "font-bold text-gold underline decoration-2 underline-offset-4 hover:text-ink"
