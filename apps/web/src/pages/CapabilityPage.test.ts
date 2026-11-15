import { describe, expect, it } from 'vitest';
import { capabilityPath, catalogItemPath, normalizeCatalogPage } from './CapabilityPage';

describe('media navigation contract', () => {
  it('builds stable encoded provider, entity, and item routes', () => {
    expect(capabilityPath('libraries', 'plugin-jellyfin', 'plugin-jellyfin.server.library one')).toBe('/libraries/plugin-jellyfin/plugin-jellyfin.server.library%20one');
    expect(catalogItemPath('plugin-jellyfin', 'plugin-jellyfin.server.library one', 'movie/one')).toBe('/libraries/plugin-jellyfin/plugin-jellyfin.server.library%20one/items/movie%2Fone');
  });

  it('normalizes null catalog items before rendering', () => {
    expect(normalizeCatalogPage({ items: null, total: 0 })).toEqual({ items: [], total: 0 });
  });
});
