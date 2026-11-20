/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

export type HeroStore = { name: string; before: string; after: string }

/**
 * One store card. A scan line sweeps across and the old site becomes the new one,
 * on a loop. Pure CSS, so it costs nothing on a phone; reduced motion shows the after.
 */
function WipeCard({
  store,
  delay,
  className,
  large,
  priority,
}: {
  store: HeroStore
  delay: number
  className?: string
  large?: boolean
  priority?: boolean
}) {
  const timing = { animationDuration: "7.5s", animationDelay: `${delay}s`, animationIterationCount: "infinite" }
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-cream shadow-[0_30px_60px_-30px_rgba(19,19,22,0.45)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10]">
        <img
          src={store.after}
          alt={`${store.name} after the rebuild`}
          className="absolute inset-0 size-full object-cover object-top"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
        <img
          src={store.before}
          alt={`${store.name} before the rebuild`}
          className="absolute inset-0 size-full object-cover object-top motion-safe:animate-[wipe-clip_linear] motion-reduce:hidden"
          style={timing}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
        <span
          className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-gold shadow-[0_0_24px_4px_rgba(238,74,18,0.55)] motion-safe:animate-[wipe-line_linear] motion-reduce:hidden"
          style={timing}
          aria-hidden="true"
        />
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full bg-ink/85 px-2.5 py-1 font-semibold tracking-[0.12em] text-white uppercase backdrop-blur motion-safe:animate-[tag-before_linear] motion-reduce:hidden",
            large ? "text-[0.68rem]" : "text-[0.6rem]",
          )}
          style={timing}
          aria-hidden="true"
        >
          Before
        </span>
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full bg-gold px-2.5 py-1 font-semibold tracking-[0.12em] text-white uppercase motion-safe:animate-[tag-after_linear] motion-reduce:opacity-100",
            large ? "text-[0.68rem]" : "text-[0.6rem]",
          )}
          style={timing}
          aria-hidden="true"
        >
          After
        </span>
      </div>
      <figcaption
        className={cn(
          "flex items-center justify-between gap-3 border-t border-line bg-white px-3.5 py-2.5 font-semibold text-ink",
          large ? "text-[0.86rem]" : "text-[0.72rem]",
        )}
      >
        <span className="truncate">{store.name}</span>
        <span className="shrink-0 text-tan">Rebuilt by LocalEyes</span>
      </figcaption>
    </figure>
  )
}

/**
 * The hero stage: the main card in front (the VSL when it exists, otherwise a store
 * rebuild), with other rebuilt stores fanned out behind it, like the reference page's
 * course slides. Side cards drift gently; each runs its own before and after.
 */
export function HeroStage({ center, side, className }: { center: React.ReactNode; side: HeroStore[]; className?: string }) {
  const left = side[0]
  const right = side[1] ?? side[0]
  return (
    <div className={cn("relative mx-auto w-full max-w-[1040px] px-2 sm:px-6", className)}>
      {left ? (
        <div
          className="absolute top-[8%] left-[-6%] w-[44%] opacity-90 motion-safe:animate-[drift_9s_ease-in-out_infinite] sm:left-[-2%] sm:w-[40%]"
          style={{ ["--tilt" as string]: "-6deg", transform: "rotate(-6deg)" }}
        >
          <WipeCard store={left} delay={1.2} />
        </div>
      ) : null}
      {right ? (
        <div
          className="absolute top-[8%] right-[-6%] w-[44%] opacity-90 motion-safe:animate-[drift_10s_ease-in-out_infinite] sm:right-[-2%] sm:w-[40%]"
          style={{ ["--tilt" as string]: "6deg", transform: "rotate(6deg)", animationDelay: "-3s" }}
        >
          <WipeCard store={right} delay={3.6} />
        </div>
      ) : null}
      <div className="relative z-10 mx-auto w-[84%] sm:w-[66%]">{center}</div>
    </div>
  )
}

export { WipeCard }
