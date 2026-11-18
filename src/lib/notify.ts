import "server-only"
import { tryGetRepo } from "@/lib/db/repo"

export type AlertKind =
  | "qualified_application"
  | "review_application"
  | "call_booked"
  | "call_canceled"
  | "no_show"
  | "payment_cleared"
  | "access_code"
  | "intake_submitted"
  | "clock_started"
  | "save_failed"
  | "config_missing"

type Delivery = { sms?: string; email?: string }

const siteUrl = () => (process.env.SITE_URL || "").replace(/\/$/, "")

export async function sendSms(to: string, body: string): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  if (!sid || !token || !from) return "not configured"
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 1500) }),
    cache: "no-store",
  })
  if (!res.ok) return `failed ${res.status}: ${(await res.text()).slice(0, 200)}`
  return "sent"
}

export async function sendEmail(opts: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) return "not configured"
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      reply_to: opts.replyTo || process.env.EMAIL_REPLY_TO || undefined,
    }),
    cache: "no-store",
  })
  if (!res.ok) return `failed ${res.status}: ${(await res.text()).slice(0, 200)}`
  return "sent"
}

/**
 * Text and/or email Kent. Every alert is also written to the alerts table, so
 * nothing is lost if a channel is down. Never throws.
 */
export async function notifyKent(kind: AlertKind, message: string, context: Record<string, unknown> = {}) {
  const delivered: Delivery = {}
  const link = context.adminPath ? `\n${siteUrl()}${context.adminPath}` : ""
  const sms = `LE 48hr: ${message}${link}`

  try {
    if (process.env.KENT_ALERT_PHONE) delivered.sms = await sendSms(process.env.KENT_ALERT_PHONE, sms)
  } catch (err) {
    delivered.sms = `error: ${err instanceof Error ? err.message : String(err)}`
  }
  try {
    if (process.env.KENT_ALERT_EMAIL) {
      delivered.email = await sendEmail({
        to: process.env.KENT_ALERT_EMAIL,
        subject: `48 Hour Rebuild: ${message.split("\n")[0].slice(0, 90)}`,
        text: `${message}${link}\n\n${JSON.stringify(context, null, 2)}`,
      })
    }
  } catch (err) {
    delivered.email = `error: ${err instanceof Error ? err.message : String(err)}`
  }

  const anySent = Object.values(delivered).includes("sent")
  if (!anySent) console.error(`[alert:${kind}] NOT DELIVERED to Kent`, message, delivered)
  else console.info(`[alert:${kind}]`, message)

  try {
    const repo = await tryGetRepo()
    await repo?.insertAlert({ kind, message, context, delivered: delivered as Record<string, unknown> })
  } catch (err) {
    console.error("[alert] could not log alert", err)
  }
  return { delivered, anySent }
}

/** Use in every catch around a save: log, alert Kent, and hand back a message for the visitor. */
export async function reportSaveFailure(where: string, err: unknown, context: Record<string, unknown> = {}) {
  const detail = err instanceof Error ? err.message : String(err)
  console.error(`[save failed] ${where}`, err)
  await notifyKent("save_failed", `Save failed: ${where}. ${detail}`.slice(0, 300), context)
}
