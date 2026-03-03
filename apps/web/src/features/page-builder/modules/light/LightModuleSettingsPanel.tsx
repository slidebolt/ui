import type { Dispatch, SetStateAction } from 'react';
import type {
  LightBrightnessSettings,
  LightColorSettings,
  LightColorSliderSettings,
  LightIconOnlySettings,
  LightInfoCardSettings,
  LightTemperatureSettings,
  ValueLabelDisplay,
} from '../../moduleSettings';
import type { BuilderModuleType } from '../../types';
import { usePageBuilderTheme } from '../../theme';

interface LightModuleSettingsPanelProps {
  itemId: string;
  selectedModule: BuilderModuleType | undefined;
  selectedLightIconOnlySettings: LightIconOnlySettings;
  selectedLightTemperatureSettings: LightTemperatureSettings;
  selectedLightBrightnessSettings: LightBrightnessSettings;
  selectedLightColorSliderSettings: LightColorSliderSettings;
  selectedLightColorSettings: LightColorSettings;
  selectedLightInfoCardSettings: LightInfoCardSettings;
  setLightIconOnlySettingsByItemId: Dispatch<SetStateAction<Record<string, LightIconOnlySettings>>>;
  setLightTemperatureSettingsByItemId: Dispatch<SetStateAction<Record<string, LightTemperatureSettings>>>;
  setLightBrightnessSettingsByItemId: Dispatch<SetStateAction<Record<string, LightBrightnessSettings>>>;
  setLightColorSliderSettingsByItemId: Dispatch<SetStateAction<Record<string, LightColorSliderSettings>>>;
  setLightColorSettingsByItemId: Dispatch<SetStateAction<Record<string, LightColorSettings>>>;
  setLightInfoCardSettingsByItemId: Dispatch<SetStateAction<Record<string, LightInfoCardSettings>>>;
}

const parseNumberSetting = (value: string, fallback: number, min: number, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

export default function LightModuleSettingsPanel({
  itemId,
  selectedModule,
  selectedLightIconOnlySettings,
  selectedLightTemperatureSettings,
  selectedLightBrightnessSettings,
  selectedLightColorSliderSettings,
  selectedLightColorSettings,
  selectedLightInfoCardSettings,
  setLightIconOnlySettingsByItemId,
  setLightTemperatureSettingsByItemId,
  setLightBrightnessSettingsByItemId,
  setLightColorSliderSettingsByItemId,
  setLightColorSettingsByItemId,
  setLightInfoCardSettingsByItemId,
}: LightModuleSettingsPanelProps) {
  const theme = usePageBuilderTheme();
  const groupStyle = { display: 'grid', gap: theme.tokens.spacing.cardGap };
  const toggleLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: theme.tokens.typography.valueSize + 2,
    color: theme.tokens.colors.textPrimary,
  };
  const fieldLabelStyle = { fontSize: theme.tokens.typography.valueSize + 1, color: theme.tokens.colors.textPrimary };
  const textInputStyle = {
    width: '100%',
    marginTop: 4,
    padding: '6px 8px',
    borderRadius: theme.tokens.radius.control,
    border: `1px solid ${theme.tokens.colors.border}`,
    background: theme.tokens.colors.surface,
    color: theme.tokens.colors.textPrimary,
  };

  if (!selectedModule || !selectedModule.startsWith('light-')) return null;

  return (
    <>
                            {selectedModule === 'light-icon-only' && (
                              <div style={groupStyle}>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightIconOnlySettings.showHeader}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, showHeader: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show header
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightIconOnlySettings.mobileMode}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, mobileMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Mobile mode
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightIconOnlySettings.compactMode}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, compactMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Compact mode
                                </label>
                                <label style={fieldLabelStyle}>
                                  Layout
                                  <select
                                    value={selectedLightIconOnlySettings.layout}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightIconOnlySettings,
                                          layout: event.target.value as LightIconOnlySettings['layout'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="vertical">Vertical</option>
                                    <option value="horizontal">Horizontal</option>
                                  </select>
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightIconOnlySettings.showStatusText}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, showStatusText: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show status text
                                </label>
                                <label style={fieldLabelStyle}>
                                  Icon size
                                  <input
                                    type="number"
                                    value={selectedLightIconOnlySettings.iconSize}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightIconOnlySettings,
                                          iconSize: parseNumberSetting(event.target.value, selectedLightIconOnlySettings.iconSize, 16, 72),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card min width
                                  <input
                                    type="number"
                                    value={selectedLightIconOnlySettings.cardMinWidth}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightIconOnlySettings,
                                          cardMinWidth: parseNumberSetting(event.target.value, selectedLightIconOnlySettings.cardMinWidth, 140, 480),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card padding
                                  <input
                                    type="number"
                                    value={selectedLightIconOnlySettings.cardPadding}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightIconOnlySettings,
                                          cardPadding: parseNumberSetting(event.target.value, selectedLightIconOnlySettings.cardPadding, 4, 40),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  On color
                                  <input
                                    type="color"
                                    value={selectedLightIconOnlySettings.iconOnColor}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, iconOnColor: event.target.value },
                                      }))
                                    }
                                    style={{ width: '100%', marginTop: 4 }}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Off color
                                  <input
                                    type="color"
                                    value={selectedLightIconOnlySettings.iconOffColor}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, iconOffColor: event.target.value },
                                      }))
                                    }
                                    style={{ width: '100%', marginTop: 4 }}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  On label
                                  <input
                                    type="text"
                                    value={selectedLightIconOnlySettings.statusOnText}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, statusOnText: event.target.value || 'On' },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Off label
                                  <input
                                    type="text"
                                    value={selectedLightIconOnlySettings.statusOffText}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, statusOffText: event.target.value || 'Off' },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightIconOnlySettings.showShadow}
                                    onChange={(event) =>
                                      setLightIconOnlySettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightIconOnlySettings, showShadow: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show shadow
                                </label>
                              </div>
                            )}
                            {selectedModule === 'light-temperature-slider' && (
                              <div style={groupStyle}>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightTemperatureSettings.showHeader}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightTemperatureSettings, showHeader: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show header
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightTemperatureSettings.mobileMode}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightTemperatureSettings, mobileMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Mobile mode
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightTemperatureSettings.compactMode}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightTemperatureSettings, compactMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Compact mode
                                </label>
                                <label style={fieldLabelStyle}>
                                  Orientation
                                  <select
                                    value={selectedLightTemperatureSettings.orientation}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightTemperatureSettings,
                                          orientation: event.target.value as LightTemperatureSettings['orientation'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="horizontal">Horizontal</option>
                                    <option value="vertical">Vertical</option>
                                  </select>
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightTemperatureSettings.showPresetLabel}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightTemperatureSettings, showPresetLabel: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show preset label
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightTemperatureSettings.showKelvinValue}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightTemperatureSettings, showKelvinValue: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show Kelvin value
                                </label>
                                <label style={fieldLabelStyle}>
                                  Min Kelvin
                                  <input
                                    type="number"
                                    value={selectedLightTemperatureSettings.minKelvin}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightTemperatureSettings,
                                          minKelvin: parseNumberSetting(event.target.value, selectedLightTemperatureSettings.minKelvin, 1500, 9500),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Max Kelvin
                                  <input
                                    type="number"
                                    value={selectedLightTemperatureSettings.maxKelvin}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightTemperatureSettings,
                                          maxKelvin: parseNumberSetting(event.target.value, selectedLightTemperatureSettings.maxKelvin, 1800, 10000),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Step Kelvin
                                  <input
                                    type="number"
                                    value={selectedLightTemperatureSettings.stepKelvin}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightTemperatureSettings,
                                          stepKelvin: parseNumberSetting(event.target.value, selectedLightTemperatureSettings.stepKelvin, 1, 1000),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Value labels
                                  <select
                                    value={selectedLightTemperatureSettings.valueLabelDisplay}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightTemperatureSettings,
                                          valueLabelDisplay: event.target.value as ValueLabelDisplay,
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="off">Off</option>
                                    <option value="auto">Auto</option>
                                    <option value="on">On</option>
                                  </select>
                                </label>
                                <label style={fieldLabelStyle}>
                                  Rail style
                                  <select
                                    value={selectedLightTemperatureSettings.railStyle}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightTemperatureSettings,
                                          railStyle: event.target.value as LightTemperatureSettings['railStyle'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="gradient">Gradient</option>
                                    <option value="solid">Solid</option>
                                  </select>
                                </label>
                                <label style={fieldLabelStyle}>
                                  Accent color
                                  <input
                                    type="color"
                                    value={selectedLightTemperatureSettings.accentColor}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightTemperatureSettings, accentColor: event.target.value },
                                      }))
                                    }
                                    style={{ width: '100%', marginTop: 4 }}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card min width
                                  <input
                                    type="number"
                                    value={selectedLightTemperatureSettings.cardMinWidth}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightTemperatureSettings,
                                          cardMinWidth: parseNumberSetting(event.target.value, selectedLightTemperatureSettings.cardMinWidth, 160, 520),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card padding
                                  <input
                                    type="number"
                                    value={selectedLightTemperatureSettings.cardPadding}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightTemperatureSettings,
                                          cardPadding: parseNumberSetting(event.target.value, selectedLightTemperatureSettings.cardPadding, 4, 40),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightTemperatureSettings.showShadow}
                                    onChange={(event) =>
                                      setLightTemperatureSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightTemperatureSettings, showShadow: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show shadow
                                </label>
                              </div>
                            )}
                            {selectedModule === 'light-brightness-slider' && (
                              <div style={groupStyle}>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightBrightnessSettings.showHeader}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightBrightnessSettings, showHeader: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show header
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightBrightnessSettings.mobileMode}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightBrightnessSettings, mobileMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Mobile mode
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightBrightnessSettings.compactMode}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightBrightnessSettings, compactMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Compact mode
                                </label>
                                <label style={fieldLabelStyle}>
                                  Orientation
                                  <select
                                    value={selectedLightBrightnessSettings.orientation}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightBrightnessSettings,
                                          orientation: event.target.value as LightBrightnessSettings['orientation'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="horizontal">Horizontal</option>
                                    <option value="vertical">Vertical</option>
                                  </select>
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightBrightnessSettings.showPercentValue}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightBrightnessSettings, showPercentValue: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show percent value
                                </label>
                                <label style={fieldLabelStyle}>
                                  Min value
                                  <input
                                    type="number"
                                    value={selectedLightBrightnessSettings.minValue}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightBrightnessSettings,
                                          minValue: parseNumberSetting(event.target.value, selectedLightBrightnessSettings.minValue, 0, 99),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Max value
                                  <input
                                    type="number"
                                    value={selectedLightBrightnessSettings.maxValue}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightBrightnessSettings,
                                          maxValue: parseNumberSetting(event.target.value, selectedLightBrightnessSettings.maxValue, 1, 100),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Step value
                                  <input
                                    type="number"
                                    value={selectedLightBrightnessSettings.stepValue}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightBrightnessSettings,
                                          stepValue: parseNumberSetting(event.target.value, selectedLightBrightnessSettings.stepValue, 1, 20),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Value labels
                                  <select
                                    value={selectedLightBrightnessSettings.valueLabelDisplay}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightBrightnessSettings,
                                          valueLabelDisplay: event.target.value as ValueLabelDisplay,
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="off">Off</option>
                                    <option value="auto">Auto</option>
                                    <option value="on">On</option>
                                  </select>
                                </label>
                                <label style={fieldLabelStyle}>
                                  Track color
                                  <input
                                    type="color"
                                    value={selectedLightBrightnessSettings.trackColor}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightBrightnessSettings, trackColor: event.target.value },
                                      }))
                                    }
                                    style={{ width: '100%', marginTop: 4 }}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Rail color
                                  <input
                                    type="color"
                                    value={selectedLightBrightnessSettings.railColor}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightBrightnessSettings, railColor: event.target.value },
                                      }))
                                    }
                                    style={{ width: '100%', marginTop: 4 }}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Thumb size
                                  <input
                                    type="number"
                                    value={selectedLightBrightnessSettings.thumbSize}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightBrightnessSettings,
                                          thumbSize: parseNumberSetting(event.target.value, selectedLightBrightnessSettings.thumbSize, 10, 36),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card min width
                                  <input
                                    type="number"
                                    value={selectedLightBrightnessSettings.cardMinWidth}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightBrightnessSettings,
                                          cardMinWidth: parseNumberSetting(event.target.value, selectedLightBrightnessSettings.cardMinWidth, 160, 520),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card padding
                                  <input
                                    type="number"
                                    value={selectedLightBrightnessSettings.cardPadding}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightBrightnessSettings,
                                          cardPadding: parseNumberSetting(event.target.value, selectedLightBrightnessSettings.cardPadding, 4, 40),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightBrightnessSettings.showShadow}
                                    onChange={(event) =>
                                      setLightBrightnessSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightBrightnessSettings, showShadow: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show shadow
                                </label>
                              </div>
                            )}
                            {selectedModule === 'light-color-slider' && (
                              <div style={groupStyle}>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSliderSettings.showHeader}
                                    onChange={(event) =>
                                      setLightColorSliderSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSliderSettings, showHeader: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show header
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSliderSettings.mobileMode}
                                    onChange={(event) =>
                                      setLightColorSliderSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSliderSettings, mobileMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Mobile mode
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSliderSettings.compactMode}
                                    onChange={(event) =>
                                      setLightColorSliderSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSliderSettings, compactMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Compact mode
                                </label>
                                <label style={fieldLabelStyle}>
                                  Orientation
                                  <select
                                    value={selectedLightColorSliderSettings.orientation}
                                    onChange={(event) =>
                                      setLightColorSliderSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSliderSettings,
                                          orientation: event.target.value as LightColorSliderSettings['orientation'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="horizontal">Horizontal</option>
                                    <option value="vertical">Vertical</option>
                                  </select>
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSliderSettings.showHexValue}
                                    onChange={(event) =>
                                      setLightColorSliderSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSliderSettings, showHexValue: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show hex value
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card min width
                                  <input
                                    type="number"
                                    value={selectedLightColorSliderSettings.cardMinWidth}
                                    onChange={(event) =>
                                      setLightColorSliderSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSliderSettings,
                                          cardMinWidth: parseNumberSetting(event.target.value, selectedLightColorSliderSettings.cardMinWidth, 160, 520),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card padding
                                  <input
                                    type="number"
                                    value={selectedLightColorSliderSettings.cardPadding}
                                    onChange={(event) =>
                                      setLightColorSliderSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSliderSettings,
                                          cardPadding: parseNumberSetting(event.target.value, selectedLightColorSliderSettings.cardPadding, 4, 40),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSliderSettings.showShadow}
                                    onChange={(event) =>
                                      setLightColorSliderSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSliderSettings, showShadow: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show shadow
                                </label>
                              </div>
                            )}
                            {selectedModule === 'light-color-wheel' && (
                              <div style={groupStyle}>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSettings.showHeader}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSettings, showHeader: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show header
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSettings.mobileMode}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSettings, mobileMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Mobile mode
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSettings.compactMode}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSettings, compactMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Compact mode
                                </label>
                                <label style={fieldLabelStyle}>
                                  Layout
                                  <select
                                    value={selectedLightColorSettings.layout}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSettings,
                                          layout: event.target.value as LightColorSettings['layout'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="picker-top">Picker top</option>
                                    <option value="picker-left">Picker left</option>
                                  </select>
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSettings.showSwatches}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSettings, showSwatches: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show swatches
                                </label>
                                <label style={fieldLabelStyle}>
                                  Swatch columns
                                  <input
                                    type="number"
                                    value={selectedLightColorSettings.swatchColumns}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSettings,
                                          swatchColumns: parseNumberSetting(event.target.value, selectedLightColorSettings.swatchColumns, 2, 12),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Swatch size
                                  <input
                                    type="number"
                                    value={selectedLightColorSettings.swatchSize}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSettings,
                                          swatchSize: parseNumberSetting(event.target.value, selectedLightColorSettings.swatchSize, 10, 32),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSettings.showHexValue}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSettings, showHexValue: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show hex value
                                </label>
                                <label style={fieldLabelStyle}>
                                  Preview dot size
                                  <input
                                    type="number"
                                    value={selectedLightColorSettings.previewDotSize}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSettings,
                                          previewDotSize: parseNumberSetting(event.target.value, selectedLightColorSettings.previewDotSize, 6, 20),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Picker width
                                  <input
                                    type="number"
                                    value={selectedLightColorSettings.pickerWidth}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSettings,
                                          pickerWidth: parseNumberSetting(event.target.value, selectedLightColorSettings.pickerWidth, 140, 420),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSettings.allowSwatchCommands}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSettings, allowSwatchCommands: event.target.checked },
                                      }))
                                    }
                                  />
                                  Swatch click sends command
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card min width
                                  <input
                                    type="number"
                                    value={selectedLightColorSettings.cardMinWidth}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSettings,
                                          cardMinWidth: parseNumberSetting(event.target.value, selectedLightColorSettings.cardMinWidth, 180, 560),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card padding
                                  <input
                                    type="number"
                                    value={selectedLightColorSettings.cardPadding}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightColorSettings,
                                          cardPadding: parseNumberSetting(event.target.value, selectedLightColorSettings.cardPadding, 4, 40),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightColorSettings.showShadow}
                                    onChange={(event) =>
                                      setLightColorSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightColorSettings, showShadow: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show shadow
                                </label>
                              </div>
                            )}
                            {selectedModule === 'light-info-card' && (
                              <div style={groupStyle}>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.showHeader}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, showHeader: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show header
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.mobileMode}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, mobileMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Mobile mode
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.compactMode}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, compactMode: event.target.checked },
                                      }))
                                    }
                                  />
                                  Compact mode
                                </label>
                                <label style={fieldLabelStyle}>
                                  Layout
                                  <select
                                    value={selectedLightInfoCardSettings.layout}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightInfoCardSettings,
                                          layout: event.target.value as LightInfoCardSettings['layout'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="stacked">Stacked</option>
                                    <option value="two-column">Two column</option>
                                  </select>
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.showStatus}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, showStatus: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show status
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.showBrightness}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, showBrightness: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show brightness
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.showTemperature}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, showTemperature: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show temperature
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.showColor}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, showColor: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show color
                                </label>
                                <label style={fieldLabelStyle}>
                                  Label case
                                  <select
                                    value={selectedLightInfoCardSettings.labelCase}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightInfoCardSettings,
                                          labelCase: event.target.value as LightInfoCardSettings['labelCase'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="uppercase">Uppercase</option>
                                  </select>
                                </label>
                                <label style={fieldLabelStyle}>
                                  Value weight
                                  <select
                                    value={selectedLightInfoCardSettings.valueWeight}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightInfoCardSettings,
                                          valueWeight: event.target.value as LightInfoCardSettings['valueWeight'],
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                  </select>
                                </label>
                                <label style={fieldLabelStyle}>
                                  Row gap
                                  <input
                                    type="number"
                                    value={selectedLightInfoCardSettings.rowGap}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightInfoCardSettings,
                                          rowGap: parseNumberSetting(event.target.value, selectedLightInfoCardSettings.rowGap, 2, 20),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.showColorDot}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, showColorDot: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show color dot
                                </label>
                                <label style={fieldLabelStyle}>
                                  Fallback text
                                  <input
                                    type="text"
                                    value={selectedLightInfoCardSettings.fallbackText}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, fallbackText: event.target.value || 'N/A' },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card min width
                                  <input
                                    type="number"
                                    value={selectedLightInfoCardSettings.cardMinWidth}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightInfoCardSettings,
                                          cardMinWidth: parseNumberSetting(event.target.value, selectedLightInfoCardSettings.cardMinWidth, 160, 520),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={fieldLabelStyle}>
                                  Card padding
                                  <input
                                    type="number"
                                    value={selectedLightInfoCardSettings.cardPadding}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: {
                                          ...selectedLightInfoCardSettings,
                                          cardPadding: parseNumberSetting(event.target.value, selectedLightInfoCardSettings.cardPadding, 4, 40),
                                        },
                                      }))
                                    }
                                    style={textInputStyle}
                                  />
                                </label>
                                <label style={toggleLabelStyle}>
                                  <input
                                    type="checkbox"
                                    checked={selectedLightInfoCardSettings.showShadow}
                                    onChange={(event) =>
                                      setLightInfoCardSettingsByItemId((current) => ({
                                        ...current,
                                        [itemId]: { ...selectedLightInfoCardSettings, showShadow: event.target.checked },
                                      }))
                                    }
                                  />
                                  Show shadow
                                </label>
                              </div>
                            )}
    </>
  );
}
