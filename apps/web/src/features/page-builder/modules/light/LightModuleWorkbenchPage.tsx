import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LightModuleCardContent, { getLightModuleMinWidth } from './LightModuleCardContent';
import LightModuleSettingsPanel from './LightModuleSettingsPanel';
import { lightModuleOptions } from './index';
import { PageBuilderThemeProvider } from '../../theme';
import {
  DEFAULT_LIGHT_BRIGHTNESS_SETTINGS,
  DEFAULT_LIGHT_COLOR_SETTINGS,
  DEFAULT_LIGHT_COLOR_SLIDER_SETTINGS,
  DEFAULT_LIGHT_ICON_ONLY_SETTINGS,
  DEFAULT_LIGHT_INFO_CARD_SETTINGS,
  DEFAULT_LIGHT_TEMPERATURE_SETTINGS,
  type LightBrightnessSettings,
  type LightColorSettings,
  type LightColorSliderSettings,
  type LightIconOnlySettings,
  type LightInfoCardSettings,
  type LightTemperatureSettings,
} from '../../moduleSettings';
import type { BuilderModuleType } from '../../types';

const WORKBENCH_ITEM_ID = 'light-module-workbench';

const clampNumber = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  const parsed = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
  const value = Number.parseInt(parsed, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = (rgb?: number[]): string => {
  if (!rgb || rgb.length < 3) return '#ffffff';
  return `#${rgb
    .slice(0, 3)
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`;
};

const getTemperatureLabel = (temperature: number): string => {
  if (temperature < 2600) return 'Candlelight';
  if (temperature < 3200) return 'Warm White';
  if (temperature < 4300) return 'Soft White';
  if (temperature < 5400) return 'Neutral White';
  return 'Daylight';
};

function isLightModule(moduleId: string | undefined): moduleId is BuilderModuleType {
  if (!moduleId) return false;
  return lightModuleOptions.some((option) => option.value === moduleId);
}

function LightModuleWorkbenchPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const selectedModule = isLightModule(moduleId) ? moduleId : undefined;
  const [lightPower, setLightPower] = useState(true);
  const [lightTemperature, setLightTemperature] = useState(4000);
  const [lightBrightness, setLightBrightness] = useState(50);
  const [lightRgb, setLightRgb] = useState<[number, number, number]>([255, 200, 120]);
  const [lightIconOnlySettingsByItemId, setLightIconOnlySettingsByItemId] =
    useState<Record<string, LightIconOnlySettings>>({ [WORKBENCH_ITEM_ID]: { ...DEFAULT_LIGHT_ICON_ONLY_SETTINGS } });
  const [lightTemperatureSettingsByItemId, setLightTemperatureSettingsByItemId] =
    useState<Record<string, LightTemperatureSettings>>({ [WORKBENCH_ITEM_ID]: { ...DEFAULT_LIGHT_TEMPERATURE_SETTINGS } });
  const [lightBrightnessSettingsByItemId, setLightBrightnessSettingsByItemId] =
    useState<Record<string, LightBrightnessSettings>>({ [WORKBENCH_ITEM_ID]: { ...DEFAULT_LIGHT_BRIGHTNESS_SETTINGS } });
  const [lightColorSliderSettingsByItemId, setLightColorSliderSettingsByItemId] =
    useState<Record<string, LightColorSliderSettings>>({ [WORKBENCH_ITEM_ID]: { ...DEFAULT_LIGHT_COLOR_SLIDER_SETTINGS } });
  const [lightColorSettingsByItemId, setLightColorSettingsByItemId] =
    useState<Record<string, LightColorSettings>>({ [WORKBENCH_ITEM_ID]: { ...DEFAULT_LIGHT_COLOR_SETTINGS } });
  const [lightInfoCardSettingsByItemId, setLightInfoCardSettingsByItemId] =
    useState<Record<string, LightInfoCardSettings>>({ [WORKBENCH_ITEM_ID]: { ...DEFAULT_LIGHT_INFO_CARD_SETTINGS } });

  const selectedLightIconOnlySettings = lightIconOnlySettingsByItemId[WORKBENCH_ITEM_ID] || DEFAULT_LIGHT_ICON_ONLY_SETTINGS;
  const selectedLightTemperatureSettings = lightTemperatureSettingsByItemId[WORKBENCH_ITEM_ID] || DEFAULT_LIGHT_TEMPERATURE_SETTINGS;
  const selectedLightBrightnessSettings = lightBrightnessSettingsByItemId[WORKBENCH_ITEM_ID] || DEFAULT_LIGHT_BRIGHTNESS_SETTINGS;
  const selectedLightColorSliderSettings = lightColorSliderSettingsByItemId[WORKBENCH_ITEM_ID] || DEFAULT_LIGHT_COLOR_SLIDER_SETTINGS;
  const selectedLightColorSettings = lightColorSettingsByItemId[WORKBENCH_ITEM_ID] || DEFAULT_LIGHT_COLOR_SETTINGS;
  const selectedLightInfoCardSettings = lightInfoCardSettingsByItemId[WORKBENCH_ITEM_ID] || DEFAULT_LIGHT_INFO_CARD_SETTINGS;

  const moduleMinWidth = useMemo(
    () => getLightModuleMinWidth(
      selectedModule,
      selectedLightIconOnlySettings,
      selectedLightTemperatureSettings,
      selectedLightBrightnessSettings,
      selectedLightColorSliderSettings,
      selectedLightColorSettings,
      selectedLightInfoCardSettings,
      clampNumber
    ),
    [
      selectedModule,
      selectedLightIconOnlySettings,
      selectedLightTemperatureSettings,
      selectedLightBrightnessSettings,
      selectedLightColorSliderSettings,
      selectedLightColorSettings,
      selectedLightInfoCardSettings,
    ]
  );

  if (!selectedModule) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Light Module Workbench</h2>
        <div style={{ marginBottom: 12, color: '#64748b' }}>Select a valid module:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {lightModuleOptions.map((option) => (
            <Link key={option.value} to={`/page-builder/modules/light/${option.value}`}>
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const lightHexValue = rgbToHex(lightRgb);

  return (
    <PageBuilderThemeProvider>
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Light Module Workbench</h2>
        <Link to="/page-builder">Back to Page Builder</Link>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {lightModuleOptions.map((option) => (
          <Link
            key={option.value}
            to={`/page-builder/modules/light/${option.value}`}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 10px',
              textDecoration: 'none',
              color: selectedModule === option.value ? '#0f172a' : '#334155',
              background: selectedModule === option.value ? '#e2e8f0' : '#fff',
            }}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 16,
            background: '#f8fafc',
            minWidth: Math.max(280, moduleMinWidth + 32),
          }}
        >
          <LightModuleCardContent
            baseTitle="Light"
            moduleHeading="Workbench Light"
            assignedEntity={{ id: 'workbench-light', domain: 'light', local_name: 'Workbench Light' }}
            selectedModuleForDevice={selectedModule}
            lightCommandBusy={false}
            isLightOn={lightPower}
            lightTemperature={lightTemperature}
            lightBrightness={lightBrightness}
            lightRgb={lightRgb}
            lightTemperatureValue={lightTemperature}
            lightBrightnessValue={lightBrightness}
            lightHexValue={lightHexValue}
            iconSettings={selectedLightIconOnlySettings}
            temperatureSettings={selectedLightTemperatureSettings}
            brightnessSettings={selectedLightBrightnessSettings}
            colorSliderSettings={selectedLightColorSliderSettings}
            colorSettings={selectedLightColorSettings}
            infoCardSettings={selectedLightInfoCardSettings}
            getTemperatureLabel={getTemperatureLabel}
            clampNumber={clampNumber}
            hexToRgb={hexToRgb}
            rgbToHex={rgbToHex}
            onToggleLight={() => setLightPower((current) => !current)}
            onTemperatureInput={setLightTemperature}
            onTemperatureCommit={setLightTemperature}
            onBrightnessInput={setLightBrightness}
            onBrightnessCommit={setLightBrightness}
            onRgbInput={setLightRgb}
            onColorCommit={setLightRgb}
          />
        </div>

        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 16,
            background: '#fff',
            minWidth: 320,
            maxWidth: 420,
            width: '100%',
          }}
        >
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Module Settings</div>
          <LightModuleSettingsPanel
            itemId={WORKBENCH_ITEM_ID}
            selectedModule={selectedModule}
            selectedLightIconOnlySettings={selectedLightIconOnlySettings}
            selectedLightTemperatureSettings={selectedLightTemperatureSettings}
            selectedLightBrightnessSettings={selectedLightBrightnessSettings}
            selectedLightColorSliderSettings={selectedLightColorSliderSettings}
            selectedLightColorSettings={selectedLightColorSettings}
            selectedLightInfoCardSettings={selectedLightInfoCardSettings}
            setLightIconOnlySettingsByItemId={setLightIconOnlySettingsByItemId}
            setLightTemperatureSettingsByItemId={setLightTemperatureSettingsByItemId}
            setLightBrightnessSettingsByItemId={setLightBrightnessSettingsByItemId}
            setLightColorSliderSettingsByItemId={setLightColorSliderSettingsByItemId}
            setLightColorSettingsByItemId={setLightColorSettingsByItemId}
            setLightInfoCardSettingsByItemId={setLightInfoCardSettingsByItemId}
          />
        </div>
      </div>
    </div>
    </PageBuilderThemeProvider>
  );
}

export default LightModuleWorkbenchPage;
