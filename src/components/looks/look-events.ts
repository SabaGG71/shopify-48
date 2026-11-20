"use client"

import type { Look } from "@/lib/options"
import { trackPixel } from "@/lib/pixel"

export type PickerMode = "pick" | "browse"

const eventId = (name: string) => {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`
  return `${name}_${uuid}`
}

const fire = (name: string, params: Record<string, string>) => trackPixel(name, eventId(name), params)

/**
 * Meta custom events for the lookbook, sent through the site's pixel helper.
 * Only look ids, store slugs, the view and the mode. Never anything personal.
 */
export const lookEvents = {
  opened: (look: Look, mode: PickerMode) => fire("look_opened", { look, mode }),
  viewToggle: (view: "desktop" | "phone", look: Look) => fire("look_view_toggle", { view, look }),
  storeVisit: (store: string, look: Look, mode: PickerMode) => fire("store_visit_clicked", { store, look, mode }),
  picked: (look: Look) => fire("look_picked", { look }),
}
