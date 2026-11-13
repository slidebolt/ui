import { describe, expect, it } from 'vitest';
import { buildArgs } from '../components/EntityCard';
import { commandDefinition } from './commands';

describe('command presentation contract', () => {
  it('provides typed fields for known commands', () => {
    const definition = commandDefinition('light_set_brightness');
    expect(definition.fields?.[0]).toMatchObject({ name: 'brightness', min: 0, max: 254 });
    expect(buildArgs(definition.fields ?? [], { brightness: '128' })).toEqual({ brightness: 128 });
  });

  it('requires raw plugin command arguments to be a JSON object', () => {
    const definition = commandDefinition('plugin_special_action');
    expect(definition.risky).toBe(true);
    expect(buildArgs(definition.fields ?? [], { $raw: '{"mode":"test"}' })).toEqual({ mode: 'test' });
    expect(() => buildArgs(definition.fields ?? [], { $raw: '[]' })).toThrow(/JSON object/);
  });

  it('rejects numeric values outside the domain range', () => {
    const definition = commandDefinition('cover_set_position');
    expect(() => buildArgs(definition.fields ?? [], { position: '101' })).toThrow(/allowed range/);
  });
});
