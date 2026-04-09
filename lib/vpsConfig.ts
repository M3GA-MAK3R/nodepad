const VPS_CONFIG_KEY = 'nodepad_vps_config';

export interface VPSConfig {
  apiUrl: string;   // e.g. "http://vps.tail3e8df5.ts.net:5001"
  peerId: string;   // Kubo peer ID, e.g. "12D3Koo..."
  enabled: boolean;
}

export function getVPSConfig(): VPSConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(VPS_CONFIG_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveVPSConfig(config: VPSConfig): void {
  localStorage.setItem(VPS_CONFIG_KEY, JSON.stringify(config));
}

export function clearVPSConfig(): void {
  localStorage.removeItem(VPS_CONFIG_KEY);
}

export async function fetchVPSPeerId(apiUrl: string): Promise<string> {
  const res = await fetch(`${apiUrl}/api/v0/id`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to reach Kubo API: ${res.status}`);
  const data = await res.json();
  return data.ID as string;
}
