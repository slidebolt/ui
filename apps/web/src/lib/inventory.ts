import type { ComponentStatus, DeviceEntry } from './core';
import type { Entity } from '../store/entityStore';

export type PluginInventory = {
  id: string;
  runtime?: ComponentStatus;
  devices: DeviceEntry[];
  entities: Entity[];
  ownedEntityCount: number;
  linkedEntityCount: number;
};

export function buildPluginInventory(runtime: ComponentStatus[], devices: DeviceEntry[], entities: Entity[]): PluginInventory[] {
  const ids = new Set(runtime.filter(item => item.kind === 'plugin').map(item => item.id));
  devices.forEach(device => ids.add(device.data.plugin || device.key.split('.')[0]));
  entities.forEach(entity => {
    if (entity.data.plugin) ids.add(entity.data.plugin);
  });

  return [...ids].sort().map(id => {
    const owned = entities.filter(entity => entity.data.plugin === id);
    const label = pluginAssociationLabel(id);
    const linked = entities.filter(entity => entity.data.plugin !== id && entity.data.labels?.[label]?.length);
    const pluginDevices = devices.filter(device => device.data.plugin === id || device.key.startsWith(`${id}.`));
    if (linked.length > 0) {
      pluginDevices.push({
        key: `${id}.__linked__`,
        data: {
          id: '__linked__', name: 'Linked entities', plugin: id,
          meta: { kind: 'linked-entities', label },
          status: { health: 'healthy' },
        },
      });
    }
    return {
      id,
      runtime: runtime.find(item => item.id === id),
      devices: pluginDevices,
      entities: [...owned, ...linked],
      ownedEntityCount: owned.length,
      linkedEntityCount: linked.length,
    };
  });
}

export function entitiesForDevice(entities: Entity[], device: DeviceEntry): Entity[] {
  if (device.data.meta?.kind === 'linked-entities') {
    const label = String(device.data.meta.label ?? '');
    return entities
      .filter(entity => Boolean(entity.data.labels?.[label]?.length))
      .sort((a, b) => (a.data.name || a.data.id).localeCompare(b.data.name || b.data.id));
  }
  return entities
    .filter(entity => entity.data.plugin === device.data.plugin && entity.data.deviceID === device.data.id)
    .sort((a, b) => (a.data.name || a.data.id).localeCompare(b.data.name || b.data.id));
}

export function pluginAssociationLabel(pluginID: string): string {
  return pluginID.split('-').filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1)).join('');
}

const entitySections = [
  { id: 'live-tv', title: 'Live TV', kicker: 'Now and next', types: ['tv_channel', 'tv_tuner'] },
  { id: 'libraries', title: 'Libraries', kicker: 'Browse and search', types: ['media_library', 'media_server'] },
  { id: 'scheduled', title: 'Schedules', kicker: 'Upcoming actions', types: ['schedule', 'recording_rule'] },
  { id: 'recordings', title: 'Recorders', kicker: 'Capture state', types: ['recorder'] },
  { id: 'sessions', title: 'Sessions', kicker: 'Active playback', types: ['media_session', 'media_player'] },
] as const;

export function groupEntities(entities: Entity[]) {
  const claimed = new Set<string>();
  const groups: { id: string; title: string; kicker: string; entities: Entity[] }[] = entitySections.map(section => {
    const matches = entities.filter(entity => section.types.includes(entity.data.type as never));
    matches.forEach(entity => claimed.add(entity.key));
    return { id: section.id, title: section.title, kicker: section.kicker, entities: matches };
  }).filter(group => group.entities.length > 0);
  const other = entities.filter(entity => !claimed.has(entity.key));
  if (other.length > 0) groups.push({ id: 'other', title: 'Other capabilities', kicker: 'Device controls', entities: other });
  return groups;
}
