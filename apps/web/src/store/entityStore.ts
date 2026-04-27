import { useSyncExternalStore } from 'react';

export type EntityData = {
  id: string;
  name: string;
  plugin: string;
  deviceID: string;
  type: string;
  labels: Record<string, string[]>;
  state?: Record<string, any>;
  commands?: string[];
};

export type Entity = { key: string; data: EntityData };

type Listener = () => void;

class EntityStore {
  private entities = new Map<string, Entity>();
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.entities;

  // Selective snapshot for a single entity to minimize re-renders
  getEntitySnapshot = (key: string) => {
    return this.entities.get(key);
  };

  setEntities(newEntities: Map<string, Entity>) {
    this.entities = new Map(newEntities);
    this.emit();
  }

  upsert(key: string, data: EntityData) {
    this.entities.set(key, { key, data });
    this.emit();
  }

  remove(key: string) {
    if (this.entities.delete(key)) {
      this.emit();
    }
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export const entityStore = new EntityStore();

/**
 * Hook to get all entities (reactive)
 */
export function useEntities() {
  const entities = useSyncExternalStore(
    entityStore.subscribe,
    entityStore.getSnapshot
  );
  return Array.from(entities.values());
}

/**
 * Hook to get a single entity (reactive - only re-renders when this specific entity changes)
 */
export function useEntity(key: string) {
  return useSyncExternalStore(
    entityStore.subscribe,
    () => entityStore.getEntitySnapshot(key)
  );
}
