"use client"

import { IPFSProvider } from "@/lib/IPFSContext"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return <IPFSProvider>{children}</IPFSProvider>
}
