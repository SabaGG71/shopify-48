import { cn } from "@/lib/utils"

const TILES = [
  { key: "base_revenue", label: "Total sales", value: "$00,000" },
  { key: "base_sessions", label: "Sessions", value: "00,000" },
  { key: "base_cvr", label: "Conversion rate", value: "0.0%" },
  { key: "base_aov", label: "Average order value", value: "$00" },
] as const

/**
 * A simple drawing of Shopify's Analytics overview (not a real screenshot) that
 * shows where each number lives. The tile for the focused field lights up.
 */
export function AnalyticsHelp({ active }: { active: string | null }) {
  return (
    <figure className="overflow-hidden rounded-[16px] border border-line bg-paper">
      <div className="flex items-center gap-2 border-b border-line bg-[#f1f1f1] px-3 py-2 font-sans">
        <span className="size-2.5 rounded-full bg-[#5c6ac4]/70" aria-hidden="true" />
        <span className="text-[0.72rem] font-semibold text-[#303030]">Analytics</span>
        <span className="ml-auto rounded-md border border-[#d4d4d4] bg-white px-2 py-0.5 text-[0.66rem] text-[#303030]">Last 30 days</span>
      </div>
      <div className="grid grid-cols-2 gap-2 bg-[#f6f6f7] p-3">
        {TILES.map((t) => (
          <div
            key={t.key}
            className={cn(
              "rounded-lg border bg-white p-2.5 font-sans transition-[box-shadow,border-color]",
              active === t.key ? "border-gold shadow-[0_0_0_3px_rgba(176,144,79,0.28)]" : "border-[#e3e3e3]",
            )}
          >
            <p className="text-[0.66rem] font-semibold text-[#616161]">{t.label}</p>
            <p className="mt-1 text-[0.95rem] font-semibold text-[#303030] tabular">{t.value}</p>
            <svg viewBox="0 0 100 24" className="mt-1.5 h-5 w-full" aria-hidden="true">
              <path d="M0 18 L14 15 L28 17 L42 10 L56 12 L70 7 L84 9 L100 4" fill="none" stroke={active === t.key ? "#b0904f" : "#91a3f2"} strokeWidth="2" />
            </svg>
          </div>
        ))}
      </div>
      <figcaption className="border-t border-line px-3 py-2.5 text-[0.76rem] leading-relaxed text-soft">
        In Shopify admin, open <b className="font-semibold text-ink">Analytics</b> and set the date to <b className="font-semibold text-ink">Last 30 days</b>. The four
        numbers are on the first screen.
      </figcaption>
    </figure>
  )
}
