import { describe, expect, it } from 'vitest';
import { agentSnapshot, chatAgents } from './ChatPage';
import type { Entity } from '../store/entityStore';

const entity = (key: string, type: string, commands?: string[], state?: Record<string, unknown>): Entity => ({
  key,
  data: { id: key.split('.').at(-1) ?? key, name: key, plugin: key.split('.')[0], deviceID: 'device', type, commands, state },
});

describe('agent chat contract', () => {
  it('discovers agents entirely from domain type and advertised commands', () => {
    const values = chatAgents([
      entity('plugin-z.device.prompt', 'agent', ['agent_prompt', 'agent_cancel']),
      entity('plugin-a.device.prompt', 'agent', ['agent_prompt']),
      entity('plugin-x.device.prompt', 'agent'),
      entity('plugin-x.device.light', 'light', ['agent_prompt']),
    ]);
    expect(values.map(value => value.key)).toEqual(['plugin-a.device.prompt', 'plugin-z.device.prompt']);
  });

  it('normalizes incomplete and null agent state safely', () => {
    expect(agentSnapshot()).toEqual({ seq: 0, status: 'unknown', result: '', error: '' });
    expect(agentSnapshot(entity('plugin-a.device.prompt', 'agent', ['agent_prompt'], { seq: 3, status: 'error', error: 'bad key' })))
      .toEqual({ seq: 3, status: 'error', result: '', error: 'bad key' });
  });
});
