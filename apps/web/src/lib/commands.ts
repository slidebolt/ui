export type FieldKind = 'number' | 'text' | 'boolean' | 'select' | 'json';
export type CommandField = { name: string; label: string; kind: FieldKind; min?: number; max?: number; step?: number; options?: string[]; optional?: boolean };
export type CommandDefinition = { label: string; fields?: CommandField[]; risky?: boolean };

const number = (name: string, label: string, min?: number, max?: number, step = 1): CommandField => ({ name, label, kind: 'number', min, max, step });
const text = (name: string, label: string, optional = false): CommandField => ({ name, label, kind: 'text', optional });

export const COMMANDS: Record<string, CommandDefinition> = {
  switch_turn_on: { label: 'Turn on' }, switch_turn_off: { label: 'Turn off' }, switch_toggle: { label: 'Toggle' },
  light_turn_on: { label: 'Turn on' }, light_turn_off: { label: 'Turn off' },
  light_set_brightness: { label: 'Brightness', fields: [number('brightness', 'Brightness', 0, 254)] },
  light_set_color_temp: { label: 'Color temperature', fields: [number('mireds', 'Mireds', 153, 500), number('brightness', 'Brightness', 0, 254)] },
  light_set_rgb: { label: 'RGB color', fields: [number('r', 'Red', 0, 255), number('g', 'Green', 0, 255), number('b', 'Blue', 0, 255), number('brightness', 'Brightness', 0, 254)] },
  light_set_rgbw: { label: 'RGBW color', fields: [number('r', 'Red', 0, 255), number('g', 'Green', 0, 255), number('b', 'Blue', 0, 255), number('w', 'White', 0, 255)] },
  light_set_rgbww: { label: 'RGBWW color', fields: [number('r', 'Red', 0, 255), number('g', 'Green', 0, 255), number('b', 'Blue', 0, 255), number('cw', 'Cool white', 0, 255), number('ww', 'Warm white', 0, 255)] },
  light_set_hs: { label: 'Hue / saturation', fields: [number('hue', 'Hue', 0, 360), number('saturation', 'Saturation', 0, 100)] },
  light_set_xy: { label: 'XY color', fields: [number('x', 'X', 0, 1, 0.01), number('y', 'Y', 0, 1, 0.01)] },
  light_set_white: { label: 'White', fields: [number('white', 'White', 0, 254)] },
  light_set_effect: { label: 'Effect', fields: [text('effect', 'Effect')] },
  lightstrip_set_segments: { label: 'Set segments', fields: [{ name: 'segments', label: 'Segments', kind: 'json' }] },
  fan_turn_on: { label: 'Turn on' }, fan_turn_off: { label: 'Turn off' }, fan_set_speed: { label: 'Speed', fields: [number('percentage', 'Percentage', 0, 100)] },
  cover_open: { label: 'Open' }, cover_close: { label: 'Close' }, cover_set_position: { label: 'Position', fields: [number('position', 'Position', 0, 100)] },
  lock_lock: { label: 'Lock' }, lock_unlock: { label: 'Unlock', fields: [text('code', 'Code', true)], risky: true },
  button_press: { label: 'Press' }, binary_sensor_turn_on: { label: 'Turn on' }, binary_sensor_turn_off: { label: 'Turn off' },
  number_set_value: { label: 'Set value', fields: [number('value', 'Value', undefined, undefined, 0.1)] },
  select_option: { label: 'Select option', fields: [text('option', 'Option')] }, text_set_value: { label: 'Set value', fields: [text('value', 'Value')] },
  climate_set_mode: { label: 'HVAC mode', fields: [{ name: 'hvacMode', label: 'Mode', kind: 'select', options: ['off','heat','cool','auto','dry','fan_only','heat_cool'] }] },
  climate_set_temperature: { label: 'Temperature', fields: [number('temperature', 'Temperature', -50, 100, 0.5)] },
  valve_open: { label: 'Open' }, valve_close: { label: 'Close' }, valve_set_position: { label: 'Position', fields: [number('position', 'Position', 0, 100)] },
  siren_turn_on: { label: 'Turn on', risky: true }, siren_turn_off: { label: 'Turn off' }, siren_set_tone: { label: 'Tone', fields: [text('tone', 'Tone')] },
  humidifier_turn_on: { label: 'Turn on' }, humidifier_turn_off: { label: 'Turn off' }, humidifier_set_humidity: { label: 'Humidity', fields: [number('humidity', 'Humidity', 0, 100)] }, humidifier_set_mode: { label: 'Mode', fields: [text('mode', 'Mode')] },
  alarm_arm_home: { label: 'Arm home', fields: [text('code', 'Code', true)], risky: true }, alarm_arm_away: { label: 'Arm away', fields: [text('code', 'Code', true)], risky: true }, alarm_arm_night: { label: 'Arm night', fields: [text('code', 'Code', true)], risky: true }, alarm_disarm: { label: 'Disarm', fields: [text('code', 'Code', true)], risky: true },
  media_play: { label: 'Play' }, media_pause: { label: 'Pause' }, media_stop: { label: 'Stop' }, media_next_track: { label: 'Next' }, media_previous_track: { label: 'Previous' },
  media_set_volume: { label: 'Volume', fields: [number('volumeLevel', 'Volume', 0, 1, 0.05)] }, media_mute: { label: 'Mute', fields: [{ name: 'mute', label: 'Muted', kind: 'boolean' }] }, media_select_source: { label: 'Source', fields: [text('source', 'Source')] }, media_seek: { label: 'Seek', fields: [number('positionMS', 'Position (ms)', 0)] },
  remote_turn_on: { label: 'Turn on' }, remote_turn_off: { label: 'Turn off' }, remote_set_activity: { label: 'Activity', fields: [text('activity', 'Activity')] }, remote_send_command: { label: 'Send command', fields: [text('command', 'Command')] },
  camera_record_start: { label: 'Start recording' }, camera_record_stop: { label: 'Stop recording', risky: true }, camera_enable_motion: { label: 'Enable motion' }, camera_disable_motion: { label: 'Disable motion' },
  media_stream_start: { label: 'Start stream' }, media_stream_stop: { label: 'Stop stream', risky: true },
  timer_enable: { label: 'Enable' }, timer_disable: { label: 'Disable' },
  tv_record_current: { label: 'Record current' }, tv_record_airing: { label: 'Record airing', fields: [text('airingID', 'Airing ID')] }, tv_record_series: { label: 'Record series', fields: [{ name: 'newOnly', label: 'New episodes only', kind: 'boolean' }, { name: 'includeRepeats', label: 'Include repeats', kind: 'boolean' }, text('airingID', 'Airing ID', true)] }, tv_record_cancel: { label: 'Cancel recording', risky: true },
  media_provider_connect: { label: 'Connect' }, media_provider_disconnect: { label: 'Disconnect', risky: true }, media_play_item: { label: 'Play item', fields: [{ name: 'item', label: 'Media item', kind: 'json' }, number('positionMS', 'Position (ms)', 0)] },
  pbx_reload: { label: 'Reload PBX', risky: true },
  sip_call: { label: 'Start call', fields: [text('call', 'Call'), text('target', 'Target', true), number('ring_seconds', 'Ring seconds', 0)] },
  sip_hangup: { label: 'Hang up', risky: true }, sip_play: { label: 'Play sound', fields: [text('sound', 'Sound'), { name: 'then_hangup', label: 'Hang up afterward', kind: 'boolean' }] },
  sip_mute: { label: 'Mute' }, sip_unmute: { label: 'Unmute' }, sip_hold: { label: 'Hold' }, sip_unhold: { label: 'Resume' }, sip_dtmf: { label: 'Send keypad tones', fields: [text('digits', 'Digits')] }, sip_remove: { label: 'Remove participant', risky: true },
  sip_transcribe_start: { label: 'Start transcription' }, sip_transcribe_stop: { label: 'Stop transcription' }, sip_say: { label: 'Speak', fields: [text('text', 'Text')] }, sip_message_send: { label: 'Send message', fields: [text('to', 'To'), text('text', 'Message')] },
  agent_prompt: { label: 'Prompt agent', fields: [text('text', 'Prompt'), text('session', 'Session', true)] }, agent_cancel: { label: 'Cancel agent', risky: true },
  phone_register_push_token: { label: 'Register push token', fields: [{ name: '$raw', label: 'Registration JSON', kind: 'json' }] },
  phone_send_notification: { label: 'Send notification', fields: [{ name: '$raw', label: 'Notification JSON', kind: 'json' }] }, phone_send_data_message: { label: 'Send data message', fields: [{ name: 'data', label: 'Data', kind: 'json' }] },
};

export function commandDefinition(command: string): CommandDefinition {
  return COMMANDS[command] ?? { label: command.replaceAll('_', ' '), fields: [{ name: '$raw', label: 'JSON arguments', kind: 'json' }], risky: true };
}
