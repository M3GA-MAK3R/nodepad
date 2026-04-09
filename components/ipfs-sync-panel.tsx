"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Check, Upload, Download, Loader2 } from "lucide-react"
import { useIPFS } from "@/lib/IPFSContext"
import { getVPSConfig } from "@/lib/vpsConfig"
import { VPSSettings } from "@/components/VPSSettings"
import type { TextBlock } from "@/components/tile-card"

interface IPFSSyncPanelProps {
  isOpen: boolean
  onClose: () => void
  blocks: TextBlock[]
  onMergeNotes: (notes: TextBlock[]) => void
}

export function IPFSSyncPanel({ isOpen, onClose, blocks, onMergeNotes }: IPFSSyncPanelProps) {
  const { nodeStatus, lastCID, setNodeStatus, syncToIPFS, syncFromCID } = useIPFS()
  const [pullCID, setPullCID] = useState("")
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [displayCID, setDisplayCID] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const initRef = useRef(false)

  // Start the Helia node when the panel is first opened
  useEffect(() => {
    if (!isOpen || initRef.current || nodeStatus !== "idle") return
    initRef.current = true
    setNodeStatus("starting")

    // Build VPS bootstrap multiaddr if configured
    const cfg = getVPSConfig()
    const vpsPeerMultiaddr =
      cfg?.enabled && cfg.peerId
        ? `/dns4/vps.tail3e8df5.ts.net/tcp/4001/p2p/${cfg.peerId}`
        : undefined

    // Use a variable-based import to avoid static bundler analysis
    const mod = "./lib/ipfs"
    import(/* webpackIgnore: true */ mod)
      .then((m) => m.getHelia(vpsPeerMultiaddr))
      .then(() => setNodeStatus("ready"))
      .catch((err: unknown) => {
        console.error("Helia init failed:", err)
        setNodeStatus("error")
      })
  }, [isOpen, nodeStatus, setNodeStatus])

  const handlePush = useCallback(async () => {
    setError(null)
    setPushing(true)
    try {
      const cid = await syncToIPFS(blocks)
      if (cid) {
        setDisplayCID(cid)
      } else {
        setError("Failed to publish to IPFS")
      }
    } catch {
      setError("Failed to publish to IPFS")
    } finally {
      setPushing(false)
    }
  }, [blocks, syncToIPFS])

  const handlePull = useCallback(async () => {
    if (!pullCID.trim()) return
    setError(null)
    setPulling(true)
    try {
      const notes = await syncFromCID(pullCID.trim())
      if (notes.length > 0) {
        onMergeNotes(notes)
        setPullCID("")
      } else {
        setError("No notes found at this CID")
      }
    } catch {
      setError("Failed to fetch from IPFS")
    } finally {
      setPulling(false)
    }
  }, [pullCID, syncFromCID, onMergeNotes])

  const handleCopy = useCallback(() => {
    const cid = displayCID || lastCID
    if (!cid) return
    navigator.clipboard.writeText(cid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [displayCID, lastCID])

  const statusColor =
    nodeStatus === "ready" ? "bg-green-500" :
    nodeStatus === "starting" ? "bg-yellow-500 animate-pulse" :
    nodeStatus === "error" ? "bg-red-500" :
    "bg-gray-500"

  const shownCID = displayCID || lastCID

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-md rounded-sm border border-white/10 bg-card shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/80">
                  IPFS Sync
                </span>
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                  {nodeStatus}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Push to IPFS */}
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Push to IPFS
                </p>
                <button
                  onClick={handlePush}
                  disabled={pushing || nodeStatus !== "ready"}
                  className="w-full flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs text-foreground hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pushing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {pushing ? "Publishing..." : `Push ${blocks.length} note${blocks.length !== 1 ? "s" : ""}`}
                </button>
              </div>

              {/* CID Display */}
              {shownCID && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Your CID
                  </p>
                  <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/5 px-3 py-2">
                    <code className="flex-1 font-mono text-[11px] text-primary break-all leading-snug">
                      {shownCID}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy CID"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground/60">
                    Share this CID with another device to sync notes.
                  </p>
                </div>
              )}

              {/* Pull from CID */}
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Pull from CID
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pullCID}
                    onChange={e => setPullCID(e.target.value)}
                    placeholder="Paste CID here..."
                    className="flex-1 rounded-sm border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40"
                  />
                  <button
                    onClick={handlePull}
                    disabled={pulling || !pullCID.trim() || nodeStatus !== "ready"}
                    className="shrink-0 flex items-center gap-2 rounded-sm border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-foreground hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pulling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Pull
                  </button>
                </div>
                <p className="font-mono text-[9px] text-amber-400/70">
                  Notes will be merged with your local notes.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2">
                  <p className="font-mono text-[10px] text-red-400">{error}</p>
                </div>
              )}

              {/* VPS Node Settings */}
              <VPSSettings />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
