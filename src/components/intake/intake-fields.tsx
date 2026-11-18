"use client"

import { useRef, useState } from "react"
import { upload } from "@vercel/blob/client"
import { finalizeUpload, removeUpload, startUpload } from "@/app/actions/intake"
import { FieldShell, inputBase } from "@/components/form/fields"
import { MAX_UPLOAD_BYTES, UPLOAD_ACCEPT, type ColorEntry, type DateRange, type FileRef, type UploadField, type YesNo } from "@/lib/intake/schema"
import { COLOR_ROLES, type Option } from "@/lib/options"
import { normalizeHex } from "@/lib/url"
import { cn } from "@/lib/utils"

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  )
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-[52px] shrink-0 place-items-center rounded-xl border border-line-strong text-soft hover:text-ink"
    >
      <XIcon />
    </button>
  )
}

function AddLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="justify-self-start text-[0.74rem] font-semibold tracking-[0.16em] text-ink uppercase underline decoration-gold underline-offset-4"
    >
      {children}
    </button>
  )
}

/** A list of URL inputs with add and remove. */
export function UrlListField({
  id,
  label,
  hint,
  error,
  optional,
  values,
  onChange,
  max,
  placeholder,
}: {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string
  optional?: boolean
  values: string[]
  onChange: (v: string[]) => void
  max: number
  placeholder: string
}) {
  const rows = values.length ? values : [""]
  return (
    <FieldShell id={`${id}-0`} label={label} hint={hint} error={error} optional={optional}>
      <div className="grid gap-2.5">
        {rows.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              id={`${id}-${i}`}
              aria-label={i ? `${typeof label === "string" ? label : "Link"} ${i + 1}` : undefined}
              value={v}
              onChange={(e) => {
                const next = [...rows]
                next[i] = e.target.value
                onChange(next)
              }}
              placeholder={placeholder}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              className={cn(inputBase, "h-[52px]")}
            />
            {rows.length > 1 ? <RemoveButton onClick={() => onChange(rows.filter((_, j) => j !== i))} label={`Remove link ${i + 1}`} /> : null}
          </div>
        ))}
        {rows.length < max ? <AddLink onClick={() => onChange([...rows, ""])}>Add another</AddLink> : null}
      </div>
    </FieldShell>
  )
}

/** Segmented single choice (option keys). */
export function Segmented({
  id,
  label,
  options,
  value,
  onChange,
  error,
  hint,
  className,
}: {
  id: string
  label: React.ReactNode
  options: readonly Option[]
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} as="fieldset" className={className}>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((o) => {
          const on = value === o.key
          return (
            <label
              key={o.key}
              className={cn(
                "relative flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[0.86rem] font-medium transition-colors",
                on ? "border-gold bg-[#fbf6ea] text-ink" : "border-line-strong bg-paper text-soft hover:border-ink/35 hover:text-ink",
                error && !on && "border-destructive/50",
              )}
            >
              <input type="radio" name={id} value={o.key} checked={on} onChange={() => onChange(o.key)} className="peer sr-only" />
              <span className="peer-focus-visible:underline">{o.label}</span>
            </label>
          )
        })}
      </div>
    </FieldShell>
  )
}

/** Up to five brand colours: picker, hex code and a role each. */
export function ColorRows({
  values,
  onChange,
  errors,
}: {
  values: ColorEntry[]
  onChange: (v: ColorEntry[]) => void
  errors: Record<string, string | undefined>
}) {
  const rows = values
  const usedRoles = new Set(rows.map((r) => r.role))
  const nextRole = COLOR_ROLES.find((r) => !usedRoles.has(r.key))?.key ?? "accent"
  return (
    <div className="grid gap-2.5">
      {rows.map((c, i) => {
        const hex = normalizeHex(c.hex) ?? "#FFFFFF"
        return (
          <div key={i}>
            <div className="grid grid-cols-[52px_minmax(0,1fr)_52px] gap-2 sm:grid-cols-[52px_minmax(0,1fr)_180px_52px]">
              <label className="relative size-[52px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line-strong" style={{ background: hex }}>
                <span className="sr-only">Pick color {i + 1}</span>
                <input
                  type="color"
                  value={hex.toLowerCase()}
                  onChange={(e) => {
                    const next = [...rows]
                    next[i] = { ...c, hex: e.target.value.toUpperCase() }
                    onChange(next)
                  }}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              </label>
              <input
                aria-label={`Hex code for color ${i + 1}`}
                value={c.hex}
                onChange={(e) => {
                  const next = [...rows]
                  next[i] = { ...c, hex: e.target.value }
                  onChange(next)
                }}
                onBlur={() => {
                  const n = normalizeHex(c.hex)
                  if (n && n !== c.hex) {
                    const next = [...rows]
                    next[i] = { ...c, hex: n }
                    onChange(next)
                  }
                }}
                placeholder="#1A2B3C"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={errors[`colors.${i}`] ? true : undefined}
                className={cn(inputBase, "h-[52px] font-mono uppercase")}
              />
              <div className="relative col-span-3 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                <select
                  aria-label={`Role for color ${i + 1}`}
                  value={c.role}
                  onChange={(e) => {
                    const next = [...rows]
                    next[i] = { ...c, role: e.target.value }
                    onChange(next)
                  }}
                  className={cn(inputBase, "h-[52px] appearance-none pr-9")}
                >
                  {COLOR_ROLES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-tan" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="col-start-3 row-start-1 sm:col-start-4">
                <RemoveButton onClick={() => onChange(rows.filter((_, j) => j !== i))} label={`Remove color ${i + 1}`} />
              </div>
            </div>
            {errors[`colors.${i}`] ? (
              <p role="alert" className="mt-1 text-[0.8rem] font-medium text-destructive">
                {errors[`colors.${i}`]}
              </p>
            ) : null}
          </div>
        )
      })}
      {rows.length < 5 ? <AddLink onClick={() => onChange([...rows, { hex: "", role: nextRole }])}>Add a color</AddLink> : null}
    </div>
  )
}

/** Yes or no, with a details box when yes. */
export function YesNoField({
  id,
  label,
  value,
  onChange,
  error,
  detailsLabel,
  detailsPlaceholder,
}: {
  id: string
  label: React.ReactNode
  value: YesNo
  onChange: (v: YesNo) => void
  error?: string
  detailsLabel: string
  detailsPlaceholder: string
}) {
  return (
    <div className="grid gap-3">
      <Segmented
        id={id}
        label={label}
        options={[
          { key: "yes", label: "Yes" },
          { key: "no", label: "No" },
        ]}
        value={value.enabled === null ? "" : value.enabled ? "yes" : "no"}
        onChange={(v) => onChange({ ...value, enabled: v === "yes" })}
        error={error}
      />
      {value.enabled ? (
        <FieldShell id={`${id}-details`} label={detailsLabel} optional>
          <input
            id={`${id}-details`}
            value={value.details}
            onChange={(e) => onChange({ ...value, details: e.target.value })}
            placeholder={detailsPlaceholder}
            className={cn(inputBase, "h-[52px]")}
          />
        </FieldShell>
      ) : null}
    </div>
  )
}

/** Up to three date ranges. */
export function DateRanges({
  values,
  onChange,
  errors,
}: {
  values: DateRange[]
  onChange: (v: DateRange[]) => void
  errors: Record<string, string | undefined>
}) {
  return (
    <div className="grid gap-2.5">
      {values.map((r, i) => (
        <div key={i} className="rounded-xl border border-line bg-paper/60 p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[0.74rem] font-medium text-soft">
              From
              <input
                type="date"
                aria-label={`Range ${i + 1} start`}
                value={r.start}
                onChange={(e) => {
                  const next = [...values]
                  next[i] = { ...r, start: e.target.value }
                  onChange(next)
                }}
                className={cn(inputBase, "h-[48px] min-w-0 px-3")}
              />
            </label>
            <label className="grid gap-1 text-[0.74rem] font-medium text-soft">
              To
              <input
                type="date"
                aria-label={`Range ${i + 1} end`}
                value={r.end}
                min={r.start || undefined}
                onChange={(e) => {
                  const next = [...values]
                  next[i] = { ...r, end: e.target.value }
                  onChange(next)
                }}
                className={cn(inputBase, "h-[48px] min-w-0 px-3")}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="mt-2 text-[0.74rem] font-semibold text-soft underline underline-offset-4 hover:text-ink"
          >
            Remove these dates
          </button>
          {errors[`blackout.${i}`] ? (
            <p role="alert" className="mt-1 text-[0.8rem] font-medium text-destructive">
              {errors[`blackout.${i}`]}
            </p>
          ) : null}
        </div>
      ))}
      {values.length < 3 ? <AddLink onClick={() => onChange([...values, { start: "", end: "" }])}>Add dates</AddLink> : null}
    </div>
  )
}

type Uploading = { id: string; name: string; progress: number; error?: string }

function putWithProgress(url: string, file: File, headers: Record<string, string>, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."))
    xhr.send(file)
  })
}

/** Uploads straight to storage with a progress bar per file. Images, SVG, PDF, fonts and zip, 50 MB each. */
export function FileDrop({
  token,
  field,
  label,
  hint,
  error,
  optional,
  files,
  onChange,
  multiple = true,
}: {
  token: string
  field: UploadField
  label: React.ReactNode
  hint?: React.ReactNode
  error?: string
  optional?: boolean
  files: FileRef[]
  onChange: (files: FileRef[]) => void
  multiple?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<Uploading[]>([])
  const [dragOver, setDragOver] = useState(false)
  const id = `upload-${field}`

  const handle = async (list: FileList | null) => {
    if (!list?.length) return
    for (const file of Array.from(list)) {
      const uid = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`
      const set = (patch: Partial<Uploading>) => setUploading((u) => u.map((x) => (x.id === uid ? { ...x, ...patch } : x)))
      setUploading((u) => [...u, { id: uid, name: file.name, progress: 0 }])
      if (file.size > MAX_UPLOAD_BYTES) {
        set({ error: "Over 50 MB" })
        continue
      }
      try {
        const target = await startUpload(token, field, { name: file.name, size: file.size, type: file.type })
        if (!target.ok) {
          set({ error: target.error })
          continue
        }
        let ref: { path?: string; url?: string }
        if (target.mode === "blob") {
          const blob = await upload(target.pathname, file, {
            access: "public",
            handleUploadUrl: "/api/uploads",
            clientPayload: target.clientPayload,
            contentType: target.contentType,
            multipart: file.size > 8 * 1024 * 1024,
            onUploadProgress: (e) => set({ progress: e.percentage / 100 }),
          })
          ref = { url: blob.url }
        } else {
          await putWithProgress(target.uploadUrl, file, target.headers, (p) => set({ progress: p }))
          ref = { path: target.path }
        }
        const done = await finalizeUpload(token, field, ref, { name: file.name, type: file.type })
        if (!done.ok) {
          set({ error: done.error })
          continue
        }
        onChange(done.files)
        setUploading((u) => u.filter((x) => x.id !== uid))
      } catch (err) {
        set({ error: err instanceof Error ? err.message : "Upload failed" })
      }
    }
  }

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handle(e.dataTransfer.files)
        }}
        className={cn(
          "rounded-xl border border-dashed bg-paper p-3 transition-colors",
          dragOver ? "border-gold bg-[#fbf6ea]" : error ? "border-destructive" : "border-line-strong",
        )}
      >
        {files.length || uploading.length ? (
          <ul className="mb-3 grid gap-2">
            {files.map((f) => (
              <li key={f.url} className="flex items-center justify-between gap-3 rounded-lg bg-cream/60 px-3 py-2 text-[0.84rem] text-ink">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await removeUpload(token, field, f.url)
                    if (res.ok) onChange(res.files)
                  }}
                  className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-cream"
                  aria-label={`Remove ${f.name}`}
                >
                  <XIcon className="size-3" />
                </button>
              </li>
            ))}
            {uploading.map((u) => (
              <li key={u.id} className="rounded-lg bg-cream/40 px-3 py-2 text-[0.84rem]">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink">{u.name}</span>
                  {u.error ? (
                    <button type="button" onClick={() => setUploading((x) => x.filter((y) => y.id !== u.id))} className="text-[0.75rem] font-semibold text-destructive">
                      Dismiss
                    </button>
                  ) : (
                    <span className="text-tan tabular">{Math.round(u.progress * 100)}%</span>
                  )}
                </div>
                {u.error ? (
                  <p role="alert" className="mt-1 text-[0.78rem] font-medium text-destructive">
                    {u.error}
                  </p>
                ) : (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${Math.max(4, u.progress * 100)}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          id={id}
          onClick={() => input.current?.click()}
          className="flex min-h-12 w-full flex-col items-center justify-center rounded-lg bg-cream/70 px-4 py-3 text-center hover:bg-cream"
        >
          <span className="text-[0.86rem] font-semibold text-ink">{files.length ? "Add more files" : "Choose files"}</span>
          <span className="mt-0.5 text-[0.74rem] text-soft">Images, SVG, PDF, fonts or zip. Up to 50 MB each.</span>
        </button>
        <input
          ref={input}
          type="file"
          multiple={multiple}
          accept={UPLOAD_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            handle(e.target.files)
            e.target.value = ""
          }}
        />
      </div>
    </FieldShell>
  )
}
