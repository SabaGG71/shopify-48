/** The privacy copy, shared by /privacy (light blue) and /demo/privacy (lime). One source, two looks. */

export const PRIVACY_UPDATED = "November 20, 2026"

const EMAIL = "hello@localeyesgrowth.com"

export const PRIVACY_SECTIONS = [
  {
    title: "What we collect",
    body: [
      "When you apply: your store's web address, your monthly revenue band, your name, email and phone number, the look you pick (or what you tell us instead), what you sell and what isn't working.",
      "While you browse our lookbook: which looks you open and which example stores you visit. We save this with your application so we know what you liked.",
      "If you book a call or reserve a slot: the answers you give about your store's design, your booking time, and payment confirmation from Stripe. We never see your card details.",
      "If you fill the intake: store access details, brand files, product links, offers, apps, your last 30 days of store numbers and the files you upload.",
    ],
  },
  {
    title: "Why we collect it",
    body: [
      "To review your store, decide if the rebuild is a fit, contact you by text or email, and build your store. Your store numbers are used only to measure the change 30 days after launch.",
    ],
  },
  {
    title: "Cookies and ads",
    body: [
      "This site uses a cookie to remember your application, so you can come back where you left off. It also uses the Meta pixel to measure our ads, which means Meta may receive details of your visit and, in a hashed form, your email and phone number when you apply, book or pay.",
    ],
  },
  {
    title: "Who we share it with",
    body: [
      "Only the services that run this process: our database and file storage, Stripe for payments, our booking calendar, our email and text providers, and Meta for ad measurement. We don't sell your information.",
    ],
  },
  {
    title: "Your choices",
    body: [`Ask us to see, correct or delete your information at any time by emailing ${EMAIL}.`],
  },
]

/** A paragraph with the contact address turned into a mail link. */
export function PrivacyText({ text, linkClassName }: { text: string; linkClassName?: string }) {
  const parts = text.split(EMAIL)
  if (parts.length === 1) return <>{text}</>
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 ? (
            <a href={`mailto:${EMAIL}`} className={linkClassName}>
              {EMAIL}
            </a>
          ) : null}
        </span>
      ))}
    </>
  )
}
