export type PaletteItemType =
  | 'row-horizontal'
  | 'row-vertical'
  | 'device-light'
  | 'device-switch'
  | 'device-sensor'
  | 'device-camera'
  | 'device-cover';

export type DeviceType = 'light' | 'switch' | 'sensor' | 'camera' | 'cover';

export type BuilderModuleType =
  | 'light-icon-only'
  | 'light-temperature-slider'
  | 'light-brightness-slider'
  | 'light-color-slider'
  | 'light-color-wheel'
  | 'light-info-card';

export type DragPayload = { source: 'palette'; itemType: PaletteItemType } | { source: 'canvas'; itemId: string };

export interface ItemLocation {
  parentId: string | null;
  index: number;
}

export interface DeviceItem {
  id: string;
  type: 'device';
  deviceType: DeviceType;
}

export interface AvailableEntity {
  id: string;
  domain?: string;
  name?: string;
  local_name?: string;
  plugin_id?: string;
  device_id?: string;
  actions?: string[];
  schema?: {
    commands?: Array<{ action?: string }>;
  };
  data?: {
    desired?: {
      power?: boolean;
      temperature?: number;
      brightness?: number;
      rgb?: number[];
    };
    reported?: {
      power?: boolean;
      temperature?: number;
      brightness?: number;
      rgb?: number[];
    };
    effective?: {
      power?: boolean;
      temperature?: number;
      brightness?: number;
      rgb?: number[];
    };
  };
}

export interface RowItem {
  id: string;
  type: 'row';
  direction: 'horizontal' | 'vertical';
  children: CanvasItem[];
}

export type CanvasItem = RowItem | DeviceItem;
