import { 
  Lightbulb, 
  Power, 
  Thermometer, 
  Droplets, 
  Wind, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  Zap,
  HelpCircle,
  Hash,
  Clock,
  Navigation,
  Tv,
  CircleDot,
  FileVideo,
  Timer
  ,Server, Library, Play, Users
} from 'lucide-react';
import { EntityData } from '../store/entityStore';

export type EntityUIProps = {
  isActive: boolean;
  value: string;
  unit?: string;
  icon: any;
  colorClass: string;
  activeColorClass: string;
};

export function getUIProperties(entity: EntityData): EntityUIProps {
  const props: EntityUIProps = {
    isActive: false,
    value: '—',
    icon: HelpCircle,
    colorClass: 'text-slate-500',
    activeColorClass: 'text-cyan-400',
  };

  if (!entity) return props;

  const { type } = entity;
  const state = entity.state || {};

  // Determine state value and activity
  switch (type) {
    case 'light':
      props.isActive = state.on === true || state.power === true;
      props.value = props.isActive ? (state.brightness ? `${Math.round((state.brightness/255)*100)}%` : 'On') : 'Off';
      props.icon = Lightbulb;
      props.activeColorClass = 'text-yellow-400';
      break;

    case 'switch':
    case 'outlet':
      props.isActive = state.on === true || state.power === true;
      props.value = props.isActive ? 'On' : 'Off';
      props.icon = Power;
      props.activeColorClass = 'text-cyan-400';
      break;

    case 'sensor':
      props.value = state.value !== undefined ? String(state.value) : '—';
      props.unit = state.unit;
      props.icon = getSensorIcon(state.unit || entity.id);
      props.isActive = true; // Sensors are usually "active" if they have data
      break;

    case 'lock':
      props.isActive = state.locked === true;
      props.value = props.isActive ? 'Locked' : 'Unlocked';
      props.icon = props.isActive ? Lock : Unlock;
      props.activeColorClass = 'text-emerald-400';
      break;

    case 'binary_sensor':
      props.isActive = state.on === true || state.value === true || state.motion === true;
      props.value = props.isActive ? 'Detected' : 'Clear';
      props.icon = state.motion !== undefined ? (props.isActive ? Eye : EyeOff) : Zap;
      props.activeColorClass = 'text-amber-400';
      break;

    case 'number':
      props.value = String(state.value ?? '—');
      props.unit = state.unit;
      props.icon = Hash;
      props.isActive = true;
      break;

    case 'button':
      props.value = 'Press';
      props.icon = Zap;
      props.isActive = false;
      break;

    case 'recording_switch':
      props.isActive = state.power === true;
      props.value = props.isActive ? `Recording${state.channel ? ` ${state.channel}` : ''}` : 'Not recording';
      props.icon = CircleDot;
      props.activeColorClass = 'text-red-400';
      break;

    case 'tv_channel': {
      const current = state.currentProgram;
      props.isActive = state.available === true;
      props.value = current
        ? `${current.title}${current.episodeTitle ? ` — ${current.episodeTitle}` : ''}`
        : 'No guide data';
      props.icon = Tv;
      break;
    }

    case 'recording_file':
      props.isActive = state.status === 'recording' || state.status === 'encoding';
      if (state.status === 'recording') {
        props.value = 'Recording';
      } else if (state.status === 'encoding') {
        props.value = state.sourceBytes
          ? `Encoding ${formatBytes(state.sourceBytes)} source`
          : 'Encoding';
      } else if (state.status === 'completed') {
        props.value = state.bytesWritten
          ? `Completed · ${formatBytes(state.bytesWritten)}`
          : 'Completed';
      } else if (state.status === 'failed') {
        props.value = state.error ? `Failed · ${state.error}` : 'Failed';
      } else {
        props.value = state.status || 'unknown';
      }
      props.icon = FileVideo;
      props.activeColorClass = state.status === 'encoding' ? 'text-amber-400' : 'text-red-400';
      break;

    case 'timer':
      props.isActive = state.enabled === true;
      props.value = state.enabled ? (state.nextOnAt ? `Next ${state.nextOnAt}` : 'Enabled') : 'Disabled';
      props.icon = Timer;
      break;

    case 'tv_recording_rule':
      props.isActive = state.enabled === true;
      props.value = props.isActive ? 'Enabled' : 'Disabled';
      props.icon = Timer;
      break;

    case 'media_provider_connection':
      props.isActive = state.status === 'connected';
      props.value = state.status || 'disconnected';
      props.icon = Server;
      break;

    case 'media_server':
      props.isActive = state.connected === true;
      props.value = state.connected ? `${state.name || 'Server'} online` : 'Offline';
      props.icon = Server;
      break;

    case 'media_library':
      props.isActive = state.canBrowse === true;
      props.value = `${state.kind || 'media'}${state.itemCount ? ` · ${state.itemCount} items` : ''}`;
      props.icon = Library;
      break;

    case 'media_player':
      props.isActive = state.state === 'playing';
      props.value = state.mediaTitle ? `${state.state} · ${state.mediaTitle}` : (state.state || 'idle');
      props.icon = Play;
      break;

    case 'media_session':
      props.isActive = state.state === 'playing';
      props.value = state.title ? `${state.state} · ${state.title}` : (state.state || 'idle');
      props.icon = Users;
      break;

    case 'tv_recording':
      props.isActive = state.status === 'recording';
      props.value = `${state.status || 'scheduled'}${state.program?.title ? ` · ${state.program.title}` : ''}`;
      props.icon = FileVideo;
      break;

    default:
      props.value = state.value !== undefined ? String(state.value) : (state.on !== undefined ? (state.on ? 'On' : 'Off') : '—');
      props.icon = HelpCircle;
  }

  return props;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unit]}`;
}

function getSensorIcon(unitOrId: string) {
  const u = unitOrId.toLowerCase();
  if (u.includes('°c') || u.includes('temp')) return Thermometer;
  if (u.includes('%') || u.includes('humidity')) return Droplets;
  if (u.includes('lux') || u.includes('illuminance')) return Lightbulb;
  if (u.includes('aqi') || u.includes('pm25')) return Wind;
  if (u.includes('v') || u.includes('w') || u.includes('a')) return Zap;
  if (u.includes('gps') || u.includes('lat') || u.includes('lon')) return Navigation;
  if (u.includes('ts') || u.includes('time')) return Clock;
  return Thermometer;
}
