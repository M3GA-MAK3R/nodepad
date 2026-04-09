"use client"

import { useState, useEffect } from "react"
import { Server, Save, Trash2 } from "lucide-react"
import { useIPFS } from "@/lib/IPFSContext"
import type { VPSConfig } from "@/lib/vpsConfig"

const DEFAULT_API_URL = "http://vps.tail3e8df5.ts.net:5001"

export function VPSSettings() {
  const { vpsConfig, vpsStatus, vpsError, saveVPSConfig, clearVPSConfig } = useIPFS()

  const [enabled, setEnabled] = useState(false)
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [peerId, setPeerId] = useState("")

  // Sync local form state from context on mount / config change
  useEffect(() => {
    if (vpsConfig) {
      setEnabled(vpsConfig.enabled)
      setApiUrl(vpsConfig.apiUrl || DEFAULT_API_URL)
      setPeerId(vpsConfig.peerId || "")
    }
  }, [vpsConfig])

  const handleSave = () => {
    const config: VPSConfig = {
      apiUrl: apiUrl.replace(/\/+$/, ""), // strip trailing slash
      peerId: peerId.trim(),
      enabled,
    }
    saveVPSConfig(config)
  }

  const handleClear = () => {
    clearVPSConfig()
    setEnabled(false)
    setApiUrl(DEFAULT_API_URL)
    setPeerId("")
  }

  const statusLabel =
    vpsStatus === "pinning" ? "Pinning..." :
    vpsStatus === "pinned"  ? "Pinned" :
    vpsStatus === "error"   ? "Error" :
    "Idle"

  const statusColor =
    vpsStatus === "pinned"  ? "text-green-400" :
    vpsStatus === "pinning" ? "text-yellow-400 animate-pulse" :
    vpsStatus === "error"   ? "text-red-400" :
    "text-muted-foreground/60"

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center gap-2">
        <Server className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          VPS Node Settings
        </p>
      </div>

      {/* Enable toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-3.5 w-3.5 rounded-sm border border-white/20 bg-white/5 accent-primary"
        />
        <span className="font-mono text-xs text-foreground">Enable VPS pinning node</span>
      </label>

      {/* API URL */}
      <div className="space-y-1">
        <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
          Kubo API URL
        </label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder={DEFAULT_API_URL}
          className="w-full rounded-sm border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40"
        />
      </div>

      {/* Peer ID */}
      <div className="space-y-1">
        <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
          Peer ID
        </label>
        <input
          type="text"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
          placeholder="12D3Koo..."
          className="w-full rounded-sm border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40"
        />
        <p className="font-mono text-[9px] text-muted-foreground/50">
          Run <code className="text-primary/70">docker exec nodepad-ipfs ipfs id -f &apos;&lt;id&gt;\n&apos;</code> on your VPS to get the Peer ID
        </p>
      </div>

      {/* Save / Clear buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] text-foreground hover:bg-white/10 transition-colors"
        >
          <Save className="h-3 w-3" />
          Save
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] text-muted-foreground hover:text-red-400 hover:bg-white/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
          VPS Status:
        </span>
        <span className={`font-mono text-[9px] uppercase tracking-wider ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {vpsError && (
        <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2">
          <p className="font-mono text-[10px] text-red-400">{vpsError}</p>
        </div>
      )}
    </div>
  )
}
