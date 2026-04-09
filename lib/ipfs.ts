/**
 * IPFS / Helia singleton — creates a browser-native libp2p node with
 * WebRTC (browser-to-browser) and WebSocket (relay fallback) transports.
 *
 * All imports are dynamic so this module is never bundled into the SSR build.
 * Guard call sites with `typeof window !== 'undefined'`.
 */

import type { TextBlock } from "@/components/tile-card"

// Re-export a minimal CID string type for convenience
export type CIDString = string

// ── Singleton Helia instance ──────────────────────────────────────────────────

let heliaInstance: any = null
let heliaPromise: Promise<any> | null = null

/**
 * Create/return the singleton Helia node.
 * If a VPS peer multiaddr is supplied it is added to the bootstrap list so the
 * browser node discovers the Kubo VPS peer on the Tailscale network.
 */
export async function getHelia(vpsPeerMultiaddr?: string) {
  if (typeof window === "undefined") throw new Error("Helia is browser-only")
  if (heliaInstance) return heliaInstance
  if (heliaPromise) return heliaPromise

  heliaPromise = (async () => {
    const { createHelia } = await import("helia")
    const { webRTCDirect } = await import("@libp2p/webrtc")
    const { webSockets } = await import("@libp2p/websockets")
    const { all: wsAllFilters } = await import("@libp2p/websockets/filters")
    const { bootstrap } = await import("@libp2p/bootstrap")

    const bootstrapList = [
      "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
      "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
      "/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp",
      "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
    ]

    if (vpsPeerMultiaddr) {
      bootstrapList.push(vpsPeerMultiaddr)
    }

    const node = await createHelia({
      libp2p: {
        transports: [
          webRTCDirect(),
          webSockets({ filter: wsAllFilters }),
        ],
        peerDiscovery: [
          bootstrap({ list: bootstrapList }),
        ],
      },
    })

    heliaInstance = node
    return node
  })()

  return heliaPromise
}

// ── VPS Kubo pin/unpin via HTTP API ─────────────────────────────────────────

/** Pin a CID to the VPS Kubo node via its HTTP API */
export async function pinToVPS(cid: string, apiUrl: string): Promise<void> {
  const url = `${apiUrl}/api/v0/pin/add?arg=${cid}&recursive=true`
  const res = await fetch(url, { method: "POST" })
  if (!res.ok) throw new Error(`VPS pin failed: ${res.status}`)
}

/** Unpin a CID from VPS (for cleanup) */
export async function unpinFromVPS(cid: string, apiUrl: string): Promise<void> {
  const url = `${apiUrl}/api/v0/pin/rm?arg=${cid}&recursive=true`
  const res = await fetch(url, { method: "POST" })
  if (!res.ok) throw new Error(`VPS unpin failed: ${res.status}`)
}

// ── Publish / Fetch helpers ──────────────────────────────────────────────────

export async function publishNotes(notes: TextBlock[]): Promise<CIDString> {
  const helia = await getHelia()
  const { unixfs } = await import("@helia/unixfs")
  const fs = unixfs(helia)

  const data = new TextEncoder().encode(JSON.stringify(notes))
  const cid = await fs.addBytes(data)
  return cid.toString()
}

export async function fetchNotes(cidStr: string): Promise<TextBlock[]> {
  const helia = await getHelia()
  const { unixfs } = await import("@helia/unixfs")
  const { CID } = await import("multiformats/cid")
  const fs = unixfs(helia)

  const cid = CID.parse(cidStr)
  const chunks: Uint8Array[] = []
  for await (const chunk of fs.cat(cid)) {
    chunks.push(chunk)
  }

  const total = chunks.reduce((acc, c) => acc + c.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  const json = new TextDecoder().decode(merged)
  return JSON.parse(json) as TextBlock[]
}

// ── LocalStorage CID persistence ─────────────────────────────────────────────

const CID_KEY = "nodepad_ipfs_cid"

export function getStoredCID(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CID_KEY)
}

export function setStoredCID(cid: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(CID_KEY, cid)
}
