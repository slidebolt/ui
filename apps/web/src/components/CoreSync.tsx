import { useCoreEvents } from '../hooks/useCoreEvents';
import { entityStore, Entity, EntityData } from '../store/entityStore';

/**
 * Top-level component that synchronizes the Core API SSE stream
 * with the high-performance local EntityStore.
 * 
 * Should be mounted once at the root of the application.
 */
export function CoreSync() {
  useCoreEvents('>', (event) => {
    switch (event.type) {
      case 'snapshot':
        if (event.items) {
          const map = new Map<string, Entity>();
          for (const item of event.items) {
            map.set(item.key, item as Entity);
          }
          entityStore.setEntities(map);
        }
        break;
      
      case 'upsert':
        if (event.key && event.data) {
          entityStore.upsert(event.key, event.data as EntityData);
        }
        break;
      
      case 'remove':
        if (event.key) {
          entityStore.remove(event.key);
        }
        break;
    }
  });

  return null; // Sync only component
}
