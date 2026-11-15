import { describe, expect, it } from 'vitest';
import { capabilityPath, catalogItemPath, childCatalogPath, normalizeCatalogPage } from './CapabilityPage';

describe('media navigation contract', () => {
  it('builds stable encoded provider, entity, and item routes', () => {
    expect(capabilityPath('libraries', 'plugin-jellyfin', 'plugin-jellyfin.server.library one')).toBe('/libraries/plugin-jellyfin/plugin-jellyfin.server.library%20one');
    expect(catalogItemPath('plugin-jellyfin', 'plugin-jellyfin.server.library one', 'movie/one')).toBe('/libraries/plugin-jellyfin/plugin-jellyfin.server.library%20one/items/movie%2Fone');
  });

  it('builds a provider-neutral show episode request', () => {
    expect(childCatalogPath('plugin-example', 'server one', 'TV Shows', 'show/one')).toBe('/media/catalog/plugin-example/server%20one/TV%20Shows?parentID=show%2Fone&kind=episode&limit=200');
  });

  it('normalizes null catalog items before rendering', () => {
    expect(normalizeCatalogPage({ items: null, total: 0 })).toEqual({ items: [], total: 0 });
  });
});
