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
  Navigation
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

    default:
      props.value = state.value !== undefined ? String(state.value) : (state.on !== undefined ? (state.on ? 'On' : 'Off') : '—');
      props.icon = HelpCircle;
  }

  return props;
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
