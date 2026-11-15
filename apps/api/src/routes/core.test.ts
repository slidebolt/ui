import { describe, expect, it } from 'vitest';
import { mediaArtworkPath, mediaItemPath } from './core.js';

describe('media core proxy paths', () => {
  it('preserves opaque item identifiers as one path segment', () => {
    expect(mediaItemPath('plugin-example', 'server one', 'TV Shows', 'show/example')).toBe(
      '/media/catalog/plugin-example/server%20one/TV%20Shows/items/show%2Fexample',
    );
  });

  it('builds provider-neutral artwork paths', () => {
    expect(mediaArtworkPath('plugin-example', 'server one', 'show/example', 'thumbnail')).toBe(
      '/media/artwork/plugin-example/server%20one/show%2Fexample/thumbnail',
    );
  });
});
