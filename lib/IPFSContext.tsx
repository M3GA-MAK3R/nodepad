"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { TextBlock } from "@/components/tile-card"

type NodeStatus = "idle" | "starting" | "ready" | "error"

interface IPFSContextValue {
  nodeStatus: NodeStatus
  lastCID: string | null
  setNodeStatus: (s: NodeStatus) => void
  setLastCID: (cid: string | null) => void
  syncToIPFS: (notes: TextBlock[]) => Promise<string | null>
  syncFromCID: (cid: string) => Promise<TextBlock[]>
}

const IPFSContext = createContext<IPFSContextValue>({
  nodeStatus: "idle",
  lastCID: null,
  setNodeStatus: () => {},
  setLastCID: () => {},
  syncToIPFS: async () => null,
  syncFromCID: async () => [],
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

  const syncToIPFS = useCallback(async (notes: TextBlock[]): Promise<string | null> => {
    try {
      const { publishNotes, setStoredCID } = await loadIPFS()
      const cid = await publishNotes(notes)
      setStoredCID(cid)
      setLastCID(cid)
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
      value={{ nodeStatus, lastCID, setNodeStatus, setLastCID, syncToIPFS, syncFromCID }}
    >
      {children}
    </IPFSContext.Provider>
  )
}
