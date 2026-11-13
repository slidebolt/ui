import { describe, expect, it } from 'vitest';
import { buildPluginInventory, entitiesForDevice, groupEntities, pluginAssociationLabel } from './inventory';
import type { ComponentStatus, DeviceEntry } from './core';
import type { Entity } from '../store/entityStore';

const runtime: ComponentStatus[] = [{ id: 'plugin-a', kind: 'plugin', state: 'ready', contractVersion: 1, restartCount: 0 }];
const devices: DeviceEntry[] = [
  { key: 'plugin-a.device-1', data: { id: 'device-1', name: 'One', plugin: 'plugin-a' } },
  { key: 'plugin-b.device-2', data: { id: 'device-2', name: 'Two', plugin: 'plugin-b' } },
];
const entities: Entity[] = [
  { key: 'plugin-a.device-1.switch', data: { id: 'switch', name: 'Switch', plugin: 'plugin-a', deviceID: 'device-1', type: 'switch' } },
  { key: 'plugin-b.device-2.sensor', data: { id: 'sensor', name: 'Sensor', plugin: 'plugin-b', deviceID: 'device-2', type: 'sensor' } },
];

describe('plugin inventory', () => {
  it('combines runtime, devices, and entities without relying on key depth', () => {
    const result = buildPluginInventory(runtime, devices, entities);
    expect(result.map(plugin => plugin.id)).toEqual(['plugin-a', 'plugin-b']);
    expect(result[0].devices).toHaveLength(1);
    expect(result[1].entities).toHaveLength(1);
  });

  it('selects entities by the declared device ID', () => {
    expect(entitiesForDevice(entities, devices[0]).map(entity => entity.data.id)).toEqual(['switch']);
  });

  it('presents entities linked to an integration label without changing ownership', () => {
    const linked: Entity = { key: 'plugin-a.device-1.linked', data: { id: 'linked', name: 'Linked', plugin: 'plugin-a', deviceID: 'device-1', type: 'switch', labels: { PluginAlexa: ['default'] } } };
    const result = buildPluginInventory([{ id: 'plugin-alexa', kind: 'plugin', state: 'ready', contractVersion: 1, restartCount: 0 }], devices, [...entities, linked]);
    const alexa = result.find(plugin => plugin.id === 'plugin-alexa')!;
    expect(pluginAssociationLabel('plugin-alexa')).toBe('PluginAlexa');
    expect(alexa).toMatchObject({ ownedEntityCount: 0, linkedEntityCount: 1 });
    expect(alexa.devices[0].data.name).toBe('Linked entities');
    expect(entitiesForDevice(alexa.entities, alexa.devices[0]).map(entity => entity.key)).toEqual([linked.key]);
  });

  it('groups media capabilities by their contract type', () => {
    const media: Entity[] = [
      { key: 'p.d.channel', data: { id: 'channel', name: '5.1', plugin: 'p', deviceID: 'd', type: 'tv_channel' } },
      { key: 'p.d.library', data: { id: 'library', name: 'TV', plugin: 'p', deviceID: 'd', type: 'media_library' } },
      { key: 'p.d.sensor', data: { id: 'sensor', name: 'Signal', plugin: 'p', deviceID: 'd', type: 'sensor' } },
    ];
    expect(groupEntities(media).map(group => [group.id, group.entities.length])).toEqual([
      ['live-tv', 1], ['libraries', 1], ['other', 1],
    ]);
  });
});
