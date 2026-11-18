/* eslint-disable @next/next/no-img-element */
import type { Look } from "@/lib/options"
import { cn } from "@/lib/utils"

/**
 * Five miniature storefronts, one per look. Every size is in container query
 * units (cqw) so the preview scales with its card like a real responsive page.
 * The motion column of the brief is shown live: lively, slow fades, none,
 * bouncy, subtle fade in.
 */

function Bag({ className, stroke = "currentColor" }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function Menu({ className, stroke = "currentColor" }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="1.8" aria-hidden="true">
      <path d="M4 8h16M4 16h16" strokeLinecap="round" />
    </svg>
  )
}

const img = (look: string, name: string) => `/styles/${look}/${name}.webp`

/* 1. Loud and bold: saturated blocks, giant condensed type, product as the hero, lively. */
export function LoudPreview() {
  const ticker = "Free shipping over $40 ✦ New: Tomato Heat ✦ Back in stock ✦ "
  return (
    <div className="flex size-full flex-col overflow-hidden bg-[#c4432a] text-[#141414]" style={{ fontFamily: "var(--font-anton)" }}>
      <div className="overflow-hidden bg-[#141414] py-[1.6cqw] text-[3.2cqw] tracking-[0.06em] whitespace-nowrap text-[#ffe14d] uppercase">
        <div className="flex w-max animate-marquee">
          <span className="pr-[3cqw]">{ticker.repeat(2)}</span>
          <span className="pr-[3cqw]" aria-hidden="true">
            {ticker.repeat(2)}
          </span>
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between px-[5cqw] pt-[3.4cqw]">
        <Menu className="size-[6cqw]" />
        <span className="text-[6.4cqw] leading-none tracking-[0.02em] uppercase">Your Brand</span>
        <Bag className="size-[6cqw]" />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <img
          src={img("loud", "hero")}
          alt=""
          loading="lazy"
          className="absolute inset-y-0 left-[24cqw] h-full w-[100cqw] max-w-none object-cover object-[50%_42%] [mask-image:linear-gradient(to_right,transparent,black_22%)]"
        />
        <p className="relative z-10 px-[5cqw] pt-[3cqw] text-[18cqw] leading-[0.86] tracking-[-0.005em] text-[#ffe14d] uppercase">
          Hot.
          <br />
          Sauce.
          <br />
          <span className="text-[#141414]">Now.</span>
        </p>
        <span className="absolute bottom-[4cqw] left-[5cqw] z-10 inline-block animate-bob rounded-[1.4cqw] bg-[#ffe14d] px-[5cqw] py-[2.6cqw] text-[4cqw] tracking-[0.06em] uppercase [animation-duration:1.4s]">
          Shop now
        </span>
      </div>
      <div className="mx-[5cqw] mb-[5cqw] flex items-center gap-[3cqw] rounded-[1.4cqw] bg-[#ffe14d] p-[2.4cqw]">
        <div className="size-[19cqw] shrink-0 overflow-hidden rounded-[1cqw] bg-[#d55d45]">
          <img src={img("loud", "product")} alt="" loading="lazy" className="size-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[4.6cqw] leading-[1] uppercase">Tomato Heat</p>
          <p className="mt-[1cqw] font-sans text-[3.2cqw] font-bold">$12</p>
        </div>
        <span className="rounded-[1cqw] bg-[#141414] px-[3.2cqw] py-[2cqw] text-[3.4cqw] text-[#ffe14d] uppercase">Add</span>
      </div>
    </div>
  )
}

/* 2. Editorial and moody: serif display, deep rich color, cinematic photo, square, outlined button, slow fades. */
export function EditorialPreview() {
  return (
    <div className="flex size-full flex-col overflow-hidden bg-[#2a0e12] text-[#f2e6d8]">
      <div className="flex items-center justify-between border-b border-[#f2e6d8]/15 px-[5cqw] py-[3.6cqw]">
        <Menu className="size-[5.4cqw]" stroke="#f2e6d8" />
        <span className="text-[6.8cqw] leading-none" style={{ fontFamily: "var(--font-instrument)" }}>
          Your Brand
        </span>
        <Bag className="size-[5.4cqw]" stroke="#f2e6d8" />
      </div>
      <div className="relative h-[78cqw] overflow-hidden">
        <img src={img("editorial", "hero")} alt="" loading="lazy" className="absolute inset-0 size-full animate-kenburns object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a0e12] via-[#2a0e12]/25 to-transparent" />
        <div className="absolute inset-x-[5cqw] bottom-[5cqw]">
          <p className="font-sans text-[2.6cqw] tracking-[0.3em] text-[#d9b98a] uppercase">The winter edit</p>
          <p className="mt-[1.6cqw] text-[12.5cqw] leading-[0.92]" style={{ fontFamily: "var(--font-instrument)" }}>
            Slow evenings,
            <br />
            dark cacao.
          </p>
          <span className="mt-[3.4cqw] inline-block border border-[#f2e6d8]/80 px-[4.6cqw] py-[2.2cqw] font-sans text-[2.8cqw] tracking-[0.24em] uppercase">
            Shop the edit
          </span>
        </div>
      </div>
      <div className="flex flex-1 items-center gap-[4cqw] px-[5cqw] pb-[4cqw]">
        <div className="relative h-[30cqw] w-[24cqw] shrink-0 overflow-hidden">
          <img src={img("editorial", "product")} alt="" loading="lazy" className="size-full object-cover" />
        </div>
        <div>
          <p className="text-[6.4cqw] leading-[1]" style={{ fontFamily: "var(--font-instrument)" }}>
            Dark Cacao 72%
          </p>
          <p className="mt-[1.4cqw] font-sans text-[3cqw] text-[#f2e6d8]/70">$18</p>
          <p className="mt-[2cqw] font-sans text-[2.6cqw] tracking-[0.22em] uppercase underline decoration-[#d9b98a] underline-offset-[1cqw]">
            Add to bag
          </p>
        </div>
      </div>
    </div>
  )
}

/* 3. Clean minimal: sans, white space, product first, quiet grid, square, solid sharp, no motion. */
export function MinimalPreview() {
  return (
    <div className="flex size-full flex-col overflow-hidden bg-white font-sans text-[#111]">
      <div className="flex items-center justify-between px-[5cqw] py-[3.6cqw]">
        <span className="text-[4.8cqw] font-semibold tracking-[-0.02em] lowercase">your brand</span>
        <div className="flex items-center gap-[3cqw]">
          <span className="text-[2.8cqw] text-[#111]/60">Shop</span>
          <Bag className="size-[5cqw]" />
        </div>
      </div>
      <div className="mx-[5cqw] grid h-[60cqw] place-items-center overflow-hidden bg-[#f3f3f1]">
        <img src={img("minimal", "hero")} alt="" loading="lazy" className="size-full object-cover" />
      </div>
      <div className="flex items-end justify-between px-[5cqw] pt-[3.4cqw]">
        <div>
          <p className="text-[6.2cqw] leading-[1.05] font-medium tracking-[-0.02em]">Raw honey</p>
          <p className="mt-[1cqw] text-[3cqw] text-[#111]/55">350 g jar</p>
        </div>
        <p className="text-[3.6cqw] font-medium">$16</p>
      </div>
      <div className="mx-[5cqw] mt-[3cqw] bg-[#111] py-[2.6cqw] text-center text-[3cqw] font-medium tracking-[0.04em] text-white">Add to cart</div>
      <div className="mt-auto grid grid-cols-3 gap-[2cqw] px-[5cqw] pb-[5cqw]">
        {["product", "product-2", "product-3"].map((n) => (
          <div key={n} className="aspect-square overflow-hidden bg-[#f3f3f1]">
            <img src={img("minimal", n)} alt="" loading="lazy" className="size-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* 4. Playful and illustrated: rounded display, pastels, characters, fully rounded, pill buttons, bouncy. */
export function PlayfulPreview() {
  return (
    <div className="flex size-full flex-col overflow-hidden bg-[#fbd6e5] text-[#3a1f6e]" style={{ fontFamily: "var(--font-fredoka)" }}>
      <div className="flex items-center justify-between px-[5cqw] pt-[4cqw] pb-[1cqw]">
        <span className="text-[6.4cqw] leading-none font-bold tracking-[-0.01em] lowercase">your brand</span>
        <span className="flex items-center gap-[1.4cqw] rounded-full bg-white px-[3cqw] py-[1.4cqw] text-[3cqw] font-semibold">
          <Bag className="size-[3.8cqw]" /> 2
        </span>
      </div>
      <p className="px-[5cqw] pt-[2.4cqw] text-[10.5cqw] leading-[0.95] font-bold tracking-[-0.01em]">
        Little treats,
        <br />
        big joy.
      </p>
      <div className="relative mx-[4cqw] mt-[3cqw] h-[54cqw] rounded-[7cqw] bg-[#f9d7e5]">
        <div className="absolute inset-0 overflow-hidden rounded-[7cqw]">
          <img src={img("playful", "hero")} alt="" loading="lazy" className="size-full object-cover object-[50%_35%]" />
        </div>
        <span
          className="absolute -top-[3cqw] right-[3cqw] grid size-[15cqw] rotate-12 animate-bob place-items-center rounded-full bg-[#b9f0d7] text-[3.4cqw] leading-none font-bold"
          style={{ ["--bob-rot" as string]: "10deg", animationTimingFunction: "cubic-bezier(.34,1.56,.64,1)", animationDuration: "1.6s" }}
        >
          New!
        </span>
        <svg viewBox="0 0 100 100" className="absolute bottom-[9cqw] -left-[2cqw] size-[10cqw] animate-[spin_9s_linear_infinite] fill-[#ffe07a] stroke-[#3a1f6e]" strokeWidth="4" aria-hidden="true">
          <path d="M50 4l12 28 31 3-24 20 8 31-27-17-27 17 8-31L7 35l31-3z" strokeLinejoin="round" />
        </svg>
        <span className="absolute bottom-[4cqw] left-[6cqw] rounded-full bg-[#3a1f6e] px-[5cqw] py-[2.6cqw] text-[3.6cqw] font-semibold text-white">
          Shop treats
        </span>
      </div>
      <div className="mx-[4cqw] mt-[3cqw] mb-[4cqw] flex flex-1 items-center gap-[3cqw] rounded-[6cqw] bg-[#ffe7a3] p-[2.6cqw]">
        <div className="size-[17cqw] shrink-0 overflow-hidden rounded-full bg-[#c68dc7]">
          <img src={img("playful", "product")} alt="" loading="lazy" className="size-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[4.8cqw] leading-[1] font-semibold">Orange Fizz</p>
          <p className="mt-[1cqw] text-[3.2cqw] font-medium">$4</p>
        </div>
        <span className="rounded-full bg-[#ff8fc0] px-[3.6cqw] py-[2cqw] text-[3.4cqw] font-semibold text-[#3a1f6e]">Add +</span>
      </div>
    </div>
  )
}

/* 5. Warm and natural: soft serif, earthy tones, warm food photography, slightly rounded, solid soft button, subtle fade in. */
export function WarmPreview({ inView = true }: { inView?: boolean }) {
  return (
    <div className="flex size-full flex-col overflow-hidden bg-[#f3eadb] text-[#3b2a1e]">
      <div className="flex items-center justify-between px-[5cqw] py-[3.6cqw]">
        <Menu className="size-[5.4cqw]" />
        <span
          className="text-[6.4cqw] leading-none"
          style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'SOFT' 100, 'opsz' 48", fontWeight: 500 }}
        >
          Your Brand
        </span>
        <Bag className="size-[5.4cqw]" />
      </div>
      <div className={cn("mx-[5cqw] h-[58cqw] overflow-hidden rounded-[3cqw]", inView && "animate-rise")}>
        <img src={img("warm", "hero")} alt="" loading="lazy" className="size-full object-cover" />
      </div>
      <div className={cn("px-[5cqw] pt-[4cqw]", inView && "animate-rise [animation-delay:180ms]")}>
        <p
          className="text-[10.5cqw] leading-[0.98]"
          style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'SOFT' 100, 'opsz' 72", fontWeight: 450 }}
        >
          Good oil,
          <br />
          slow bread.
        </p>
        <span className="mt-[3.4cqw] inline-block rounded-[2cqw] bg-[#b45a35] px-[5cqw] py-[2.6cqw] font-sans text-[3.2cqw] font-semibold text-[#fbf3e6]">
          Shop the pantry
        </span>
      </div>
      <div className="mt-auto flex items-center gap-[3cqw] border-t border-[#3b2a1e]/12 px-[5cqw] py-[3.4cqw]">
        <div className="size-[15cqw] shrink-0 overflow-hidden rounded-[2cqw] bg-[#e7d9c2]">
          <img src={img("warm", "product")} alt="" loading="lazy" className="size-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[4.8cqw] leading-[1]" style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'SOFT' 100", fontWeight: 500 }}>
            Olive Oil No. 1
          </p>
          <p className="mt-[1cqw] font-sans text-[3cqw] text-[#3b2a1e]/65">$24</p>
        </div>
        <span className="rounded-[2cqw] bg-[#6a6b45] px-[3.2cqw] py-[1.8cqw] font-sans text-[3cqw] font-semibold text-[#fbf3e6]">Add</span>
      </div>
    </div>
  )
}

export function LookPreview({ look, inView }: { look: Look; inView?: boolean }) {
  switch (look) {
    case "loud-and-bold":
      return <LoudPreview />
    case "editorial-and-moody":
      return <EditorialPreview />
    case "clean-minimal":
      return <MinimalPreview />
    case "playful-and-illustrated":
      return <PlayfulPreview />
    case "warm-and-natural":
      return <WarmPreview inView={inView} />
  }
}
