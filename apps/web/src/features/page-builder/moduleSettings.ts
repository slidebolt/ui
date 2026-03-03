export type ValueLabelDisplay = 'off' | 'auto' | 'on';

export interface LightIconOnlySettings {
  showHeader: boolean;
  mobileMode: boolean;
  compactMode: boolean;
  layout: 'vertical' | 'horizontal';
  showStatusText: boolean;
  iconOnColor: string;
  iconOffColor: string;
  iconSize: number;
  cardPadding: number;
  cardMinWidth: number;
  showShadow: boolean;
  statusOnText: string;
  statusOffText: string;
}

export interface LightTemperatureSettings {
  showHeader: boolean;
  mobileMode: boolean;
  compactMode: boolean;
  orientation: 'horizontal' | 'vertical';
  showPresetLabel: boolean;
  showKelvinValue: boolean;
  minKelvin: number;
  maxKelvin: number;
  stepKelvin: number;
  valueLabelDisplay: ValueLabelDisplay;
  railStyle: 'gradient' | 'solid';
  accentColor: string;
  cardPadding: number;
  cardMinWidth: number;
  showShadow: boolean;
}

export interface LightBrightnessSettings {
  showHeader: boolean;
  mobileMode: boolean;
  compactMode: boolean;
  orientation: 'horizontal' | 'vertical';
  showPercentValue: boolean;
  minValue: number;
  maxValue: number;
  stepValue: number;
  valueLabelDisplay: ValueLabelDisplay;
  trackColor: string;
  railColor: string;
  thumbSize: number;
  cardPadding: number;
  cardMinWidth: number;
  showShadow: boolean;
}

export interface LightColorSettings {
  showHeader: boolean;
  mobileMode: boolean;
  compactMode: boolean;
  layout: 'picker-top' | 'picker-left';
  showSwatches: boolean;
  swatchColumns: number;
  swatchSize: number;
  showHexValue: boolean;
  previewDotSize: number;
  pickerWidth: number;
  allowSwatchCommands: boolean;
  cardPadding: number;
  cardMinWidth: number;
  showShadow: boolean;
}

export interface LightColorSliderSettings {
  showHeader: boolean;
  mobileMode: boolean;
  compactMode: boolean;
  orientation: 'horizontal' | 'vertical';
  showHexValue: boolean;
  cardPadding: number;
  cardMinWidth: number;
  showShadow: boolean;
}

export interface LightInfoCardSettings {
  showHeader: boolean;
  mobileMode: boolean;
  compactMode: boolean;
  layout: 'stacked' | 'two-column';
  showStatus: boolean;
  showBrightness: boolean;
  showTemperature: boolean;
  showColor: boolean;
  labelCase: 'normal' | 'uppercase';
  valueWeight: 'normal' | 'bold';
  rowGap: number;
  showColorDot: boolean;
  fallbackText: string;
  cardPadding: number;
  cardMinWidth: number;
  showShadow: boolean;
}

export const DEFAULT_LIGHT_ICON_ONLY_SETTINGS: LightIconOnlySettings = {
  showHeader: true,
  mobileMode: true,
  compactMode: false,
  layout: 'vertical',
  showStatusText: true,
  iconOnColor: '#f59e0b',
  iconOffColor: '#64748b',
  iconSize: 28,
  cardPadding: 12,
  cardMinWidth: 180,
  showShadow: true,
  statusOnText: 'On',
  statusOffText: 'Off',
};

export const DEFAULT_LIGHT_TEMPERATURE_SETTINGS: LightTemperatureSettings = {
  showHeader: true,
  mobileMode: true,
  compactMode: false,
  orientation: 'horizontal',
  showPresetLabel: true,
  showKelvinValue: true,
  minKelvin: 2000,
  maxKelvin: 6500,
  stepKelvin: 50,
  valueLabelDisplay: 'auto',
  railStyle: 'gradient',
  accentColor: '#f59e0b',
  cardPadding: 12,
  cardMinWidth: 220,
  showShadow: true,
};

export const DEFAULT_LIGHT_BRIGHTNESS_SETTINGS: LightBrightnessSettings = {
  showHeader: true,
  mobileMode: true,
  compactMode: false,
  orientation: 'horizontal',
  showPercentValue: true,
  minValue: 0,
  maxValue: 100,
  stepValue: 1,
  valueLabelDisplay: 'auto',
  trackColor: '#f59e0b',
  railColor: '#e2e8f0',
  thumbSize: 16,
  cardPadding: 12,
  cardMinWidth: 220,
  showShadow: true,
};

export const DEFAULT_LIGHT_COLOR_SETTINGS: LightColorSettings = {
  showHeader: true,
  mobileMode: true,
  compactMode: false,
  layout: 'picker-top',
  showSwatches: true,
  swatchColumns: 8,
  swatchSize: 16,
  showHexValue: true,
  previewDotSize: 10,
  pickerWidth: 220,
  allowSwatchCommands: true,
  cardPadding: 12,
  cardMinWidth: 220,
  showShadow: true,
};

export const DEFAULT_LIGHT_COLOR_SLIDER_SETTINGS: LightColorSliderSettings = {
  showHeader: true,
  mobileMode: true,
  compactMode: false,
  orientation: 'horizontal',
  showHexValue: true,
  cardPadding: 12,
  cardMinWidth: 220,
  showShadow: true,
};

export const DEFAULT_LIGHT_INFO_CARD_SETTINGS: LightInfoCardSettings = {
  showHeader: true,
  mobileMode: true,
  compactMode: false,
  layout: 'stacked',
  showStatus: true,
  showBrightness: true,
  showTemperature: true,
  showColor: true,
  labelCase: 'normal',
  valueWeight: 'bold',
  rowGap: 6,
  showColorDot: true,
  fallbackText: 'N/A',
  cardPadding: 12,
  cardMinWidth: 220,
  showShadow: true,
};
