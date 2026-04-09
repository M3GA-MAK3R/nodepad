"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type { TextBlock } from "@/components/tile-card"
import {
  type VPSConfig,
  getVPSConfig,
  saveVPSConfig as persistVPSConfig,
  clearVPSConfig as removeVPSConfig,
  fetchVPSPeerId,
} from "@/lib/vpsConfig"

type NodeStatus = "idle" | "starting" | "ready" | "error"
type VPSStatus = "idle" | "pinning" | "pinned" | "error"

interface IPFSContextValue {
  nodeStatus: NodeStatus
  lastCID: string | null
  setNodeStatus: (s: NodeStatus) => void
  setLastCID: (cid: string | null) => void
  syncToIPFS: (notes: TextBlock[]) => Promise<string | null>
  syncFromCID: (cid: string) => Promise<TextBlock[]>
  vpsConfig: VPSConfig | null
  vpsStatus: VPSStatus
  vpsError: string | null
  saveVPSConfig: (config: VPSConfig) => void
  clearVPSConfig: () => void
}

const IPFSContext = createContext<IPFSContextValue>({
  nodeStatus: "idle",
  lastCID: null,
  setNodeStatus: () => {},
  setLastCID: () => {},
  syncToIPFS: async () => null,
  syncFromCID: async () => [],
  vpsConfig: null,
  vpsStatus: "idle",
  vpsError: null,
  saveVPSConfig: () => {},
  clearVPSConfig: () => {},
})

export function useIPFS() {
  return useContext(IPFSContext)
}

/**
 * Dynamically loads lib/ipfs.ts at runtime using a variable to prevent
 * the bundler from statically analyzing the import target.
 */
async function loadIPFS() {
  // Use a variable so Turbopack / webpack cannot statically resolve the path
  const mod = "./ipfs"
  return await import(/* webpackIgnore: true */ mod)
}

export function IPFSProvider({ children }: { children: ReactNode }) {
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>("idle")
  const [lastCID, setLastCID] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("nodepad_ipfs_cid")
  })

  const [vpsConfig, setVPSConfig] = useState<VPSConfig | null>(null)
  const [vpsStatus, setVPSStatus] = useState<VPSStatus>("idle")
  const [vpsError, setVPSError] = useState<string | null>(null)

  // Load VPS config from localStorage on mount; auto-fetch peerId if missing
  useEffect(() => {
    const cfg = getVPSConfig()
    if (cfg) {
      setVPSConfig(cfg)
      if (!cfg.peerId && cfg.apiUrl) {
        fetchVPSPeerId(cfg.apiUrl)
          .then((id) => {
            const updated = { ...cfg, peerId: id }
            persistVPSConfig(updated)
            setVPSConfig(updated)
          })
          .catch(() => {
            // Silently ignore — user can retry via Test Connection
          })
      }
    }
  }, [])

  const handleSaveVPSConfig = useCallback((config: VPSConfig) => {
    persistVPSConfig(config)
    setVPSConfig(config)
    setVPSError(null)
    setVPSStatus("idle")
  }, [])

  const handleClearVPSConfig = useCallback(() => {
    removeVPSConfig()
    setVPSConfig(null)
    setVPSError(null)
    setVPSStatus("idle")
  }, [])

  const syncToIPFS = useCallback(async (notes: TextBlock[]): Promise<string | null> => {
    try {
      const { publishNotes, setStoredCID, pinToVPS } = await loadIPFS()
      const cid = await publishNotes(notes)
      setStoredCID(cid)
      setLastCID(cid)

      // Pin to VPS if enabled (non-blocking — don't fail the whole sync)
      const cfg = getVPSConfig()
      if (cfg?.enabled && cfg.apiUrl) {
        setVPSStatus("pinning")
        setVPSError(null)
        try {
          await pinToVPS(cid, cfg.apiUrl)
          setVPSStatus("pinned")
        } catch (err) {
          const msg = err instanceof Error ? err.message : "VPS pin failed"
          console.error("VPS pin failed:", err)
          setVPSError(msg)
          setVPSStatus("error")
        }
      }

      return cid
    } catch (err) {
      console.error("IPFS publish failed:", err)
      return null
    }
  }, [])

  const syncFromCID = useCallback(async (cid: string): Promise<TextBlock[]> => {
    try {
      const { fetchNotes } = await loadIPFS()
      return await fetchNotes(cid)
    } catch (err) {
      console.error("IPFS fetch failed:", err)
      return []
    }
  }, [])

  return (
    <IPFSContext.Provider
      value={{
        nodeStatus,
        lastCID,
        setNodeStatus,
        setLastCID,
        syncToIPFS,
        syncFromCID,
        vpsConfig,
        vpsStatus,
        vpsError,
        saveVPSConfig: handleSaveVPSConfig,
        clearVPSConfig: handleClearVPSConfig,
      }}
    >
      {children}
    </IPFSContext.Provider>
  )
}
