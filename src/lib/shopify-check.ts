import "server-only"
import { lookup } from "node:dns/promises"
import net from "node:net"

export type ShopifyCheck = {
  /** true = Shopify, false = reachable and not Shopify, null = could not tell (blocked, down, timeout) */
  isShopify: boolean | null
  signal: string
  finalUrl: string | null
  storeName: string | null
}

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
const TIMEOUT_MS = 9000
const MAX_BYTES = 1_500_000

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number)
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    )
  }
  const v6 = ip.toLowerCase()
  return v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6 === "::"
}

/** Refuse anything that is not a public https/http host (no SSRF into private networks). */
async function assertPublic(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad protocol")
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("bad port")
  const host = url.hostname
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("private host")
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("private ip")
    return
  }
  const addrs = await lookup(host, { all: true })
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("private ip")
}

/** Shopify answers with its own headers, even on redirects (e.g. apex domain to www). */
function hasShopifyHeaders(h: Headers) {
  return Boolean(
    h.get("x-shopid") || h.get("x-shopify-stage") || h.get("x-shardid") || (h.get("powered-by") ?? "").toLowerCase().includes("shopify"),
  )
}

async function fetchLimited(url: string, accept: string) {
  let current = new URL(url)
  let shopifyHeader = false
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(current)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(current, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: { "user-agent": UA, accept, "accept-language": "en-US,en;q=0.9" },
        cache: "no-store",
      })
      if (hasShopifyHeaders(res.headers)) shopifyHeader = true
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, current)
        continue
      }
      let body = ""
      if (res.body) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let total = 0
        while (total < MAX_BYTES) {
          const { done, value } = await reader.read()
          if (done) break
          total += value.byteLength
          body += decoder.decode(value, { stream: true })
        }
        reader.cancel().catch(() => {})
      }
      return { status: res.status, headers: res.headers, body, url: current.toString(), shopifyHeader }
    } catch (err) {
      // A redirect that already proved Shopify is enough, even if the next hop is slow.
      if (shopifyHeader) return { status: 0, headers: new Headers(), body: "", url: current.toString(), shopifyHeader }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
  if (shopifyHeader) return { status: 0, headers: new Headers(), body: "", url: current.toString(), shopifyHeader }
  throw new Error("too many redirects")
}

/** One retry for a slow or flaky first attempt. */
async function fetchWithRetry(url: string, accept: string) {
  try {
    return await fetchLimited(url, accept)
  } catch (err) {
    if (err instanceof Error && /private|bad (protocol|port)/.test(err.message)) throw err
    return fetchLimited(url, accept)
  }
}

function storeNameFrom(html: string) {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{1,80})["']/i)
  const raw = og?.[1] ?? html.match(/<title[^>]*>([^<]{1,120})<\/title>/i)?.[1]
  if (!raw) return null
  return raw
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .split(/\s[|–—-]\s/)[0]
    .trim()
    .slice(0, 60) || null
}

/** Live Shopify store? cdn.shopify.com in the page source, Shopify headers, or a working /cart.js. */
export async function checkShopify(storeUrl: string): Promise<ShopifyCheck> {
  let page: Awaited<ReturnType<typeof fetchLimited>> | null = null
  let pageError: string | null = null
  try {
    page = await fetchWithRetry(storeUrl, "text/html,application/xhtml+xml")
  } catch (err) {
    pageError = err instanceof Error ? err.message : "fetch failed"
  }

  if (page) {
    if (page.shopifyHeader) return { isShopify: true, signal: "shopify headers", finalUrl: page.url, storeName: storeNameFrom(page.body) }
    if (page.body.includes("cdn.shopify.com") || /Shopify\.shop\s*=/.test(page.body)) {
      return { isShopify: true, signal: "cdn.shopify.com in page source", finalUrl: page.url, storeName: storeNameFrom(page.body) }
    }
  }

  // Second test: Shopify answers /cart.js with the cart as JSON.
  try {
    const origin = new URL(page?.url ?? storeUrl).origin
    const cart = await fetchWithRetry(`${origin}/cart.js`, "application/json")
    if (cart.status === 200) {
      try {
        const json = JSON.parse(cart.body)
        if (json && typeof json === "object" && "items" in json && ("token" in json || "item_count" in json)) {
          return { isShopify: true, signal: "/cart.js answered", finalUrl: page?.url ?? storeUrl, storeName: page ? storeNameFrom(page.body) : null }
        }
      } catch {
        /* not JSON */
      }
    }
  } catch {
    /* fall through */
  }

  if (!page) return { isShopify: null, signal: `store unreachable (${pageError})`, finalUrl: null, storeName: null }
  if ([401, 403, 429, 503].includes(page.status) && page.body.length < 20000) {
    return { isShopify: null, signal: `store blocked the check (HTTP ${page.status})`, finalUrl: page.url, storeName: null }
  }
  if (page.status >= 500) return { isShopify: null, signal: `store is down (HTTP ${page.status})`, finalUrl: page.url, storeName: null }
  if (page.status >= 400) return { isShopify: false, signal: `store returned HTTP ${page.status}`, finalUrl: page.url, storeName: null }
  return { isShopify: false, signal: "no Shopify signals found", finalUrl: page.url, storeName: storeNameFrom(page.body) }
}
