"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Option } from "@/lib/options"

export const inputBase =
  "block w-full rounded-xl border border-line-strong bg-paper px-4 text-base text-ink placeholder:text-tan/80 transition-[border-color,box-shadow] outline-none focus:border-gold focus:ring-3 focus:ring-gold/20 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/15 disabled:opacity-60"

export function FieldShell({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
  as = "div",
}: {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string | null
  optional?: boolean
  children: React.ReactNode
  className?: string
  as?: "div" | "fieldset"
}) {
  const Tag = as
  const LabelTag = as === "fieldset" ? "legend" : "label"
  return (
    <Tag className={cn("min-w-0", className)}>
      <LabelTag
        {...(as === "fieldset" ? {} : { htmlFor: id })}
        className="mb-2 flex items-baseline justify-between gap-3 text-[0.86rem] font-semibold text-ink"
      >
        <span>{label}</span>
        {optional ? <span className="text-[0.72rem] font-medium text-tan">Optional</span> : null}
      </LabelTag>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.78rem] leading-relaxed text-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[0.8rem] font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </Tag>
  )
}

const describedBy = (id: string, hint?: React.ReactNode, error?: string | null) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined

export function TextField({
  id,
  label,
  hint,
  error,
  optional,
  className,
  inputClassName,
  ...props
}: Omit<React.ComponentProps<"input">, "id"> & {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string | null
  optional?: boolean
  inputClassName?: string
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(inputBase, "h-[52px]", inputClassName)}
        {...props}
      />
    </FieldShell>
  )
}

export function TextArea({
  id,
  label,
  hint,
  error,
  optional,
  className,
  rows = 3,
  ...props
}: Omit<React.ComponentProps<"textarea">, "id"> & {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string | null
  optional?: boolean
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(inputBase, "min-h-[96px] resize-y py-3 leading-relaxed")}
        {...props}
      />
    </FieldShell>
  )
}

export function SelectField({
  id,
  label,
  hint,
  error,
  optional,
  options,
  placeholder = "Choose one",
  className,
  ...props
}: Omit<React.ComponentProps<"select">, "id"> & {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string | null
  optional?: boolean
  options: readonly Option[]
  placeholder?: string
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(inputBase, "h-[52px] appearance-none pr-11", !props.value && "text-tan")}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.key} value={o.key} className="text-ink">
              {o.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-tan"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FieldShell>
  )
}

/** Radio tiles: label on the left, a round dot on the right. */
export function ChoiceGroup<K extends string>({
  id,
  label,
  hint,
  error,
  optional,
  options,
  value,
  onChange,
  columns = 2,
  className,
  lastFull,
}: {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string | null
  optional?: boolean
  options: readonly Option<K>[]
  value: K | "" | null | undefined
  onChange: (v: K) => void
  columns?: 2 | 3 | 4 | 5
  className?: string
  /** Let the last tile span the full row on two-column phones (odd counts). */
  lastFull?: boolean
}) {
  const cols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4", 5: "grid-cols-2 sm:grid-cols-5" }[columns]
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className} as="fieldset">
      <div className={cn("grid gap-2", cols)} role="radiogroup" aria-describedby={describedBy(id, hint, error)}>
        {options.map((o, i) => {
          const checked = value === o.key
          const inputId = `${id}-${o.key}`
          return (
            <label
              key={o.key}
              htmlFor={inputId}
              className={cn(
                "group relative flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-xl border bg-paper px-3.5 py-2.5 text-[0.9rem] text-ink transition-colors",
                checked ? "border-gold bg-[#fbf6ea]" : "border-line-strong hover:border-ink/35",
                lastFull && i === options.length - 1 && options.length % 2 === 1 && "col-span-2 sm:col-span-1",
                error && !checked && "border-destructive/50",
              )}
            >
              <input
                id={inputId}
                type="radio"
                name={id}
                value={o.key}
                checked={checked}
                onChange={() => onChange(o.key)}
                className="peer sr-only"
              />
              <span className="leading-tight font-medium">{o.label}</span>
              <span
                className={cn(
                  "grid size-[18px] shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gold",
                  checked ? "border-gold bg-gold" : "border-line-strong",
                )}
                aria-hidden="true"
              >
                <span className={cn("size-1.5 rounded-full bg-paper", checked ? "opacity-100" : "opacity-0")} />
              </span>
            </label>
          )
        })}
      </div>
    </FieldShell>
  )
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-[#fbeee9] px-4 py-3 text-[0.86rem] leading-relaxed text-[#7a2414]">
      {children}
    </div>
  )
}
