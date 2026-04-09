"use client"

import { useState, useEffect } from "react"
import { Server, Save, Trash2, Wifi, Loader2, Copy, Check } from "lucide-react"
import { useIPFS } from "@/lib/IPFSContext"
import type { VPSConfig } from "@/lib/vpsConfig"
import { fetchVPSPeerId } from "@/lib/vpsConfig"

const DEFAULT_API_URL = "http://vps.tail3e8df5.ts.net:5001"

export function VPSSettings() {
  const { vpsConfig, vpsStatus, vpsError, saveVPSConfig, clearVPSConfig } = useIPFS()

  const [enabled, setEnabled] = useState(false)
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [peerId, setPeerId] = useState("")
  const [testing, setTesting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Sync local form state from context on mount / config change
  useEffect(() => {
    if (vpsConfig) {
      setEnabled(vpsConfig.enabled)
      setApiUrl(vpsConfig.apiUrl || DEFAULT_API_URL)
      setPeerId(vpsConfig.peerId || "")
      if (vpsConfig.peerId) setConnected(true)
    }
  }, [vpsConfig])

  const handleTestConnection = async () => {
    setTesting(true)
    setConnectError(null)
    setConnected(false)
    try {
      const url = apiUrl.replace(/\/+$/, "")
      const id = await fetchVPSPeerId(url)
      setPeerId(id)
      setConnected(true)
      // Auto-save config with fetched peer ID
      const config: VPSConfig = { apiUrl: url, peerId: id, enabled }
      saveVPSConfig(config)
    } catch {
      setConnectError("Cannot reach node — is VPS reachable via Tailscale?")
      setPeerId("")
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    const url = apiUrl.replace(/\/+$/, "")
    let id = peerId.trim()
    // Auto-fetch peer ID if not yet available
    if (!id) {
      try {
        id = await fetchVPSPeerId(url)
        setPeerId(id)
        setConnected(true)
      } catch {
        setConnectError("Cannot reach node — is VPS reachable via Tailscale?")
        return
      }
    }
    const config: VPSConfig = { apiUrl: url, peerId: id, enabled }
    saveVPSConfig(config)
  }

  const handleClear = () => {
    clearVPSConfig()
    setEnabled(false)
    setApiUrl(DEFAULT_API_URL)
    setPeerId("")
    setConnected(false)
    setConnectError(null)
  }

  const handleCopyPeerId = () => {
    navigator.clipboard.writeText(peerId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

      {/* Test Connection */}
      <div className="space-y-1.5">
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] text-foreground hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wifi className="h-3 w-3" />
          )}
          {testing ? "Testing..." : "Test Connection"}
        </button>

        {connected && peerId && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-green-400">
                Connected
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={peerId}
                readOnly
                className="flex-1 rounded-sm border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-foreground/70 outline-none cursor-default"
              />
              <button
                onClick={handleCopyPeerId}
                className="flex items-center justify-center rounded-sm border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}

        {connectError && (
          <p className="font-mono text-[10px] text-red-400">{connectError}</p>
        )}

        <p className="font-mono text-[9px] text-muted-foreground/50">
          Make sure your VPS is reachable via Tailscale before connecting.
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
