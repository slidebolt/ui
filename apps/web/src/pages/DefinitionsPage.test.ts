import { describe, expect, it } from 'vitest';
import { componentsWithResources, normalizeCatalog } from './DefinitionsPage';

describe('normalizeCatalog', () => {
  it('turns null Go slices into render-safe arrays', () => {
    const catalog = normalizeCatalog({
      schemaVersion: 2,
      domain: { deviceSchema: {}, entityTypes: null, commands: null },
      plugins: null,
      coverage: {
        devices: { total: 1, resolved: 1, unresolved: null },
        entities: { total: 2, resolved: 2, unresolved: null },
        commands: { total: 3, resolved: 3, unresolved: null },
      },
    } as never);

    expect(catalog.domain.entityTypes).toEqual([]);
    expect(catalog.domain.commands).toEqual([]);
    expect(catalog.plugins).toEqual([]);
    expect(Object.values(catalog.coverage).every(section => section.unresolved.length === 0)).toBe(true);
  });
});

it('selects resource-bearing components without component-specific rules', () => {
  const components = componentsWithResources([
    { id: 'plain', kind: 'service', state: 'ready', contractVersion: 1, restartCount: 0 },
    { id: 'provider', kind: 'plugin', state: 'degraded', contractVersion: 1, restartCount: 0, resources: [{ id: 'api', kind: 'service', name: 'API', description: 'Supplies data.', state: 'degraded' }] },
  ]);
  expect(components.map(component => component.id)).toEqual(['provider']);
});
