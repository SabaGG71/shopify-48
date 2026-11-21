import { ThemedContainer, ThemedShell, ThemedTitle, type SiteTheme } from "./themed-shell"

/** A simple message page (not a fit, thanks, reserved) in the design the visitor came from. */
export function MessagePage({
  theme = "home",
  label,
  title,
  children,
}: {
  theme?: SiteTheme
  label: string
  title: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <ThemedShell theme={theme} mainClassName="pt-14 pb-24 sm:pt-20 sm:pb-28">
      <ThemedContainer theme={theme} className="max-w-[860px]">
        <ThemedTitle theme={theme} label={label} title={title} />
        <div className="mt-6 grid max-w-[44rem] gap-4 text-[1.04rem] leading-relaxed text-soft">{children}</div>
      </ThemedContainer>
    </ThemedShell>
  )
}
