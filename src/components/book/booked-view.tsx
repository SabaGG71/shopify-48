"use client"

import { useEffect, useSyncExternalStore } from "react"
import { CtaLink } from "@/components/brand/cta"
import { LabelRule, Ornament } from "@/components/brand/marks"
import { VideoPlayer } from "@/components/video/video-player"

function formatCall(iso: string | null) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
      new Date(iso),
    )
  } catch {
    return null
  }
}

const noopSubscribe = () => () => {}

/** Call time in the visitor's own time zone. Rendered after hydration so server and browser never disagree. */
function useLocalCallTime(iso: string | null) {
  return useSyncExternalStore(
    noopSubscribe,
    () => formatCall(iso),
    () => null,
  )
}

export function BookedView({
  firstName,
  callTime,
  confirmVideo,
  reserveHref,
  priceDisplay,
  priceNote,
}: {
  firstName: string
  callTime: string | null
  confirmVideo: { url: string; captions: string }
  reserveHref: string
  priceDisplay: string
  priceNote: string
}) {
  const when = useLocalCallTime(callTime)

  // Calendly's redirect can land inside our embedded calendar. Move to the full window.
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) window.top.location.href = window.location.href
    } catch {
      /* cross-origin top: stay put */
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <LabelRule>
        <Ornament /> Booked
      </LabelRule>
      <h1 className="display mt-6 text-[2.6rem] text-balance text-ink sm:text-[3.6rem]">
        {when ? (
          <>
            {firstName ? `${firstName}, you’re` : "You’re"} booked for <span className="text-gold">{when}</span>.
          </>
        ) : firstName ? (
          `${firstName}, you’re booked.`
        ) : (
          "You’re booked."
        )}
      </h1>
      <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-soft">
        Kent builds your homepage before the call and walks you through it live. The calendar invite is in your inbox.
      </p>

      <VideoPlayer url={confirmVideo.url} captions={confirmVideo.captions} title="What happens on your call" className="mt-8" />

      <ul className="mt-8 border-t border-line">
        {["On the call, you see your new homepage with your own products.", "If you like it, Kent rebuilds the rest of the store in 48 hours."].map((t) => (
          <li key={t} className="flex items-baseline gap-3 border-b border-line py-4 text-[0.98rem] text-ink">
            <Ornament className="size-2.5" />
            {t}
          </li>
        ))}
      </ul>

      {reserveHref ? (
        <div className="mt-10 rounded-[22px] border border-line bg-paper/80 p-6 sm:p-8">
          <p className="micro">Already sure?</p>
          <p className="display mt-3 text-[1.9rem] text-ink">Hold your build slot now.</p>
          {priceDisplay ? (
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
              <span className="font-semibold">{priceDisplay}</span>
              {priceNote ? <span className="text-soft">. {priceNote}</span> : null}
            </p>
          ) : null}
          <p className="mt-2 text-[0.92rem] leading-relaxed text-soft">The call still happens, and nothing goes live without your yes.</p>
          <CtaLink href={reserveHref} variant="outline" className="mt-6">
            Reserve my slot
          </CtaLink>
        </div>
      ) : null}
    </div>
  )
}
