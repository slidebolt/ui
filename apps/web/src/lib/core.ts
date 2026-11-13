import type { EntityData, ResourceStatus } from '../store/entityStore';

export type DeviceData = {
  id: string;
  name: string;
  plugin: string;
  labels?: Record<string, string[]>;
  profile?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  status?: ResourceStatus;
  entities?: EntityData[];
};

export type DeviceEntry = { key: string; data: DeviceData };

export type ComponentStatus = {
  id: string;
  kind: string;
  state: 'starting' | 'running' | 'ready' | 'stopping' | 'stopped' | 'failed' | 'unknown' | string;
  contractVersion: number;
  dependencies?: string[];
  startedAt?: string;
  readyAt?: string;
  restartCount: number;
  lastError?: string;
};

export type LogEvent = {
  id: string;
  ts: string;
  source: string;
  kind: string;
  level: string;
  message: string;
  plugin?: string;
  device?: string;
  entity?: string;
  action?: string;
  trace_id?: string;
  data?: Record<string, unknown>;
};

export async function coreGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/core${path}`, { credentials: 'same-origin', signal });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// Go encodes a nil slice as JSON null. List consumers should still receive an
// array so an empty result cannot crash rendering code.
export async function coreGetArray<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const value = await coreGet<T[] | null>(path, signal);
  return Array.isArray(value) ? value : [];
}

export async function coreCommand(key: string, command: string, args: Record<string, unknown> = {}): Promise<void> {
  const response = await fetch(`/api/core/entities/${encodeURIComponent(key)}/command`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, args }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `Command failed (${response.status})`);
  }
}

export function isStale(status?: ResourceStatus): boolean | null {
  if (!status?.observedAt || !status.staleAfterSeconds) return null;
  return Date.now() - new Date(status.observedAt).getTime() > status.staleAfterSeconds * 1000;
}

