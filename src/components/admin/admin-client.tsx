"use client"

import { useActionState, useState, useTransition } from "react"
import {
  adminLogin,
  adminLogout,
  approveApplication,
  bookingLinkFor,
  markAccessConfirmed,
  resetConfigValue,
  saveConfigValue,
} from "@/app/actions/admin"
import { cn } from "@/lib/utils"

const btn =
  "inline-flex h-8 items-center rounded-md border border-[#d9dbe3] bg-white px-3 text-[13px] font-medium text-[#14161f] hover:bg-[#f4f5f8] disabled:opacity-50"
const btnPrimary = "inline-flex h-8 items-center rounded-md bg-[#1a37ff] px-3 text-[13px] font-semibold text-white hover:bg-[#1530e0] disabled:opacity-50"

const field =
  "h-10 w-full rounded-md border border-[#d9dbe3] px-3 text-[15px] outline-none focus:border-[#1a37ff] focus:ring-2 focus:ring-[#1a37ff]/20"

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M1.8 10S5 4.2 10 4.2 18.2 10 18.2 10 15 15.8 10 15.8 1.8 10 1.8 10Z" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.6" />
      {open ? null : <path d="M3.5 16.5 16.5 3.5" strokeLinecap="round" />}
    </svg>
  )
}

export function LoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null)
  const [showPassword, setShowPassword] = useState(false)
  // Controlled, so a wrong password does not clear it (React resets uncontrolled fields after an action).
  const [username, setUsername] = useState("")
  if (state?.ok) {
    if (typeof window !== "undefined") window.location.reload()
  }
  return (
    <form action={action} className="mx-auto mt-24 grid w-full max-w-sm gap-3 rounded-xl border border-[#e3e5ec] bg-white p-6">
      <h1 className="text-[17px] font-semibold text-[#14161f]">48 Hour Rebuild admin</h1>
      <label className="grid gap-1.5 text-[13px] font-medium text-[#4a4f62]">
        Username
        <input
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={field}
        />
      </label>
      <div className="grid gap-1.5">
        <label htmlFor="admin-password" className="text-[13px] font-medium text-[#4a4f62]">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={cn(field, "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-[#4a4f62] hover:text-[#14161f] focus-visible:outline-2 focus-visible:outline-[#1a37ff]"
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>
      {state && !state.ok ? <p className="text-[13px] text-[#c0262d]">{state.error}</p> : null}
      <button className={cn(btnPrimary, "h-10 justify-center")} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}

export function LogoutButton() {
  return (
    <button
      className={btn}
      onClick={async () => {
        await adminLogout()
        window.location.reload()
      }}
    >
      Sign out
    </button>
  )
}

function useFlash() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return { msg, setMsg }
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className={btn}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          window.prompt("Copy this:", text)
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  )
}

export function ApproveButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const { msg, setMsg } = useFlash()
  const [link, setLink] = useState<string | null>(null)
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {link ? (
        <CopyButton text={link} label="Copy booking link" />
      ) : (
        <button
          className={btnPrimary}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await approveApplication(id)
              if (res.ok) setLink(res.link ?? null)
              else setMsg({ ok: false, text: res.error })
            })
          }
        >
          Approve
        </button>
      )}
      {msg ? <span className={cn("text-[12px]", msg.ok ? "text-[#1d7a46]" : "text-[#c0262d]")}>{msg.text}</span> : null}
    </span>
  )
}

export function BookingLinkButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const [link, setLink] = useState<string | null>(null)
  if (link) return <CopyButton text={link} label="Copy booking link" />
  return (
    <button
      className={btn}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await bookingLinkFor(id)
          if (res.ok) setLink(res.link ?? null)
        })
      }
    >
      Booking link
    </button>
  )
}

export function AccessButton({ jobId }: { jobId: string }) {
  const [pending, start] = useTransition()
  const { msg, setMsg } = useFlash()
  return (
    <span className="inline-flex items-center gap-2">
      <button
        className={btn}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await markAccessConfirmed(jobId)
            setMsg(res.ok ? { ok: true, text: res.message ?? "Done" } : { ok: false, text: res.error })
          })
        }
      >
        Mark access confirmed
      </button>
      {msg ? <span className={cn("text-[12px]", msg.ok ? "text-[#1d7a46]" : "text-[#c0262d]")}>{msg.text}</span> : null}
    </span>
  )
}

/** One config value: edit, save, or reset to the default. */
export function ConfigRow({
  name,
  description,
  value,
  source,
  multiline,
}: {
  name: string
  description: string
  value: string
  source: "saved" | "env" | "default"
  multiline: boolean
}) {
  const [draft, setDraft] = useState(value)
  const [pending, start] = useTransition()
  const { msg, setMsg } = useFlash()
  const dirty = draft !== value
  return (
    <div className="grid gap-2 border-b border-[#eceef3] py-4 lg:grid-cols-[260px_1fr] lg:gap-6">
      <div>
        <p className="font-mono text-[13px] font-semibold text-[#14161f]">{name}</p>
        <p className="mt-1 text-[13px] leading-snug text-[#5b6075]">{description}</p>
        <p className="mt-1.5 text-[12px] text-[#8a8fa3]">
          {source === "saved" ? "Saved here" : source === "env" ? "From an env var" : "Default"}
        </p>
      </div>
      <div className="grid gap-2">
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(18, Math.max(4, draft.split("\n").length + 1))}
            spellCheck={false}
            className="w-full rounded-md border border-[#d9dbe3] bg-white p-3 font-mono text-[12.5px] leading-relaxed text-[#14161f] outline-none focus:border-[#1a37ff] focus:ring-2 focus:ring-[#1a37ff]/20"
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="h-9 w-full rounded-md border border-[#d9dbe3] bg-white px-3 text-[14px] text-[#14161f] outline-none focus:border-[#1a37ff] focus:ring-2 focus:ring-[#1a37ff]/20"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={btnPrimary}
            disabled={pending || !dirty}
            onClick={() =>
              start(async () => {
                const res = await saveConfigValue(name, draft)
                setMsg(res.ok ? { ok: true, text: res.message ?? "Saved" } : { ok: false, text: res.error })
              })
            }
          >
            Save
          </button>
          {source === "saved" ? (
            <button
              className={btn}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (!window.confirm(`Reset ${name} to its default?`)) return
                  const res = await resetConfigValue(name)
                  setMsg(res.ok ? { ok: true, text: `${res.message ?? "Reset"} Reload to see it.` } : { ok: false, text: res.error })
                })
              }
            >
              Reset to default
            </button>
          ) : null}
          {msg ? <span className={cn("text-[12px]", msg.ok ? "text-[#1d7a46]" : "text-[#c0262d]")}>{msg.text}</span> : null}
        </div>
      </div>
    </div>
  )
}
