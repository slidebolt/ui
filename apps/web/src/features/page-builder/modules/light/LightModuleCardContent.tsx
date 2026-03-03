import type { CSSProperties, ReactNode } from 'react';
import { Slider } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LightbulbOutlineIcon from '@mui/icons-material/LightbulbOutlined';
import { SliderPicker, type ColorResult } from 'react-color';
import { LIGHT_COLOR_SWATCHES } from '../../constants';
import type {
  LightBrightnessSettings,
  LightColorSettings,
  LightColorSliderSettings,
  LightIconOnlySettings,
  LightInfoCardSettings,
  LightTemperatureSettings,
} from '../../moduleSettings';
import type { AvailableEntity, BuilderModuleType } from '../../types';
import {
  BusyOverlay,
  EmptyState,
  ErrorState,
  FallbackText,
  getSliderSlotSx,
  InfoGrid,
  InfoKey,
  InfoRow,
  InfoValue,
  ModuleBody,
  ModuleFooter,
  ModuleFrame,
  ModuleHeader,
  ModuleHeaderIcon,
  ModuleHeaderTitle,
  ModuleSurface,
  PickerSurface,
  PrimaryControl,
  SectionLabel,
  SectionValue,
  SecondaryControl,
  StatusIndicator,
  SwatchGrid,
  SwatchItem,
  usePageBuilderTheme,
} from '../../theme';

interface LightModuleCardContentProps {
  baseTitle: string;
  moduleHeading: string;
  assignedEntity?: AvailableEntity;
  selectedModuleForDevice?: BuilderModuleType;
  lightCommandBusy: boolean;
  isLightOn: boolean;
  lightTemperature: number;
  lightBrightness: number;
  lightRgb: [number, number, number];
  lightTemperatureValue?: number;
  lightBrightnessValue?: number;
  lightHexValue: string | null;
  iconSettings: LightIconOnlySettings;
  temperatureSettings: LightTemperatureSettings;
  brightnessSettings: LightBrightnessSettings;
  colorSliderSettings: LightColorSliderSettings;
  colorSettings: LightColorSettings;
  infoCardSettings: LightInfoCardSettings;
  getTemperatureLabel: (temperature: number) => string;
  clampNumber: (value: number, min: number, max: number) => number;
  hexToRgb: (hex: string) => [number, number, number];
  rgbToHex: (rgb?: number[]) => string;
  onToggleLight: () => void;
  onTemperatureInput: (value: number) => void;
  onTemperatureCommit: (value: number) => void;
  onBrightnessInput: (value: number) => void;
  onBrightnessCommit: (value: number) => void;
  onRgbInput: (value: [number, number, number]) => void;
  onColorCommit: (value: [number, number, number]) => void;
}

export function getLightModuleMinWidth(
  selectedModuleForDevice: BuilderModuleType | undefined,
  iconSettings: LightIconOnlySettings,
  temperatureSettings: LightTemperatureSettings,
  brightnessSettings: LightBrightnessSettings,
  colorSliderSettings: LightColorSliderSettings,
  colorSettings: LightColorSettings,
  infoCardSettings: LightInfoCardSettings,
  clampNumber: (value: number, min: number, max: number) => number
): number {
  const colorPickerWidth = colorSettings.mobileMode ? colorSettings.pickerWidth : Math.max(140, colorSettings.pickerWidth - 30);
  const colorSwatchSize = clampNumber(colorSettings.swatchSize, 10, 32);
  const colorSwatchColumns = clampNumber(Math.round(colorSettings.swatchColumns), 2, 12);
  const colorSwatchGap = colorSettings.compactMode ? 4 : 6;
  const colorSwatchPanelWidth = colorSettings.showSwatches
    ? (colorSwatchColumns * colorSwatchSize) + ((colorSwatchColumns - 1) * colorSwatchGap)
    : 0;
  const colorContentWidth = colorSettings.layout === 'picker-left'
    ? colorPickerWidth + (colorSettings.showSwatches ? colorSwatchPanelWidth + (colorSettings.compactMode ? 6 : 10) : 0)
    : Math.max(colorPickerWidth, colorSwatchPanelWidth);

  if (selectedModuleForDevice === 'light-icon-only') return iconSettings.cardMinWidth;
  if (selectedModuleForDevice === 'light-temperature-slider') return temperatureSettings.cardMinWidth;
  if (selectedModuleForDevice === 'light-brightness-slider') return brightnessSettings.cardMinWidth;
  if (selectedModuleForDevice === 'light-color-slider') return colorSliderSettings.cardMinWidth;
  if (selectedModuleForDevice === 'light-color-wheel') return Math.max(colorSettings.cardMinWidth, colorContentWidth);
  if (selectedModuleForDevice === 'light-info-card') return infoCardSettings.cardMinWidth;
  return 150;
}

export default function LightModuleCardContent({
  baseTitle,
  moduleHeading,
  assignedEntity,
  selectedModuleForDevice,
  lightCommandBusy,
  isLightOn,
  lightTemperature,
  lightBrightness,
  lightRgb,
  lightTemperatureValue,
  lightBrightnessValue,
  lightHexValue,
  iconSettings,
  temperatureSettings,
  brightnessSettings,
  colorSliderSettings,
  colorSettings,
  infoCardSettings,
  getTemperatureLabel,
  clampNumber,
  hexToRgb,
  rgbToHex,
  onToggleLight,
  onTemperatureInput,
  onTemperatureCommit,
  onBrightnessInput,
  onBrightnessCommit,
  onRgbInput,
  onColorCommit,
}: LightModuleCardContentProps) {
  const theme = usePageBuilderTheme();
  const moduleSurfaceStyle = theme.slots.ModuleSurface;
  const sliderBaseSx = theme.mui.sliderBaseSx;
  const sliderSlotSx = getSliderSlotSx(theme);

  const renderModuleSurface = (
    heading: string,
    showHeader: boolean,
    moduleStyle: CSSProperties,
    content: ReactNode,
    footer?: ReactNode,
    headerIcon?: ReactNode
  ) => (
    <ModuleFrame>
      <ModuleSurface style={{ ...moduleStyle, ...(lightCommandBusy ? theme.slots.DisabledState : undefined) }} onClick={(event) => event.stopPropagation()}>
        {showHeader && (
          <ModuleHeader>
            {headerIcon ? <ModuleHeaderIcon>{headerIcon}</ModuleHeaderIcon> : null}
            <ModuleHeaderTitle>{heading}</ModuleHeaderTitle>
          </ModuleHeader>
        )}
        <ModuleBody>{content}</ModuleBody>
        {footer ? <ModuleFooter>{footer}</ModuleFooter> : null}
        {lightCommandBusy ? <BusyOverlay>Updating…</BusyOverlay> : null}
      </ModuleSurface>
    </ModuleFrame>
  );

  const temperatureMin = clampNumber(Math.round(temperatureSettings.minKelvin), 1500, 9500);
  const temperatureMax = clampNumber(Math.round(temperatureSettings.maxKelvin), temperatureMin + 100, 10000);
  const temperatureStep = clampNumber(Math.round(temperatureSettings.stepKelvin), 1, 1000);
  const boundedTemperature = clampNumber(lightTemperature, temperatureMin, temperatureMax);
  const brightnessMin = clampNumber(Math.round(brightnessSettings.minValue), 0, 99);
  const brightnessMax = clampNumber(Math.round(brightnessSettings.maxValue), brightnessMin + 1, 100);
  const brightnessStep = clampNumber(Math.round(brightnessSettings.stepValue), 1, 20);
  const boundedBrightness = clampNumber(lightBrightness, brightnessMin, brightnessMax);
  const colorPickerWidth = colorSettings.mobileMode ? colorSettings.pickerWidth : Math.max(140, colorSettings.pickerWidth - 30);
  const colorSwatchSize = clampNumber(colorSettings.swatchSize, 10, 32);
  const colorSwatchColumns = clampNumber(Math.round(colorSettings.swatchColumns), 2, 12);
  const colorSwatchGap = colorSettings.compactMode ? 4 : 6;
  const colorSwatchPanelWidth = colorSettings.showSwatches
    ? (colorSwatchColumns * colorSwatchSize) + ((colorSwatchColumns - 1) * colorSwatchGap)
    : 0;
  const colorContentWidth = colorSettings.layout === 'picker-left'
    ? colorPickerWidth + (colorSettings.showSwatches ? colorSwatchPanelWidth + (colorSettings.compactMode ? 6 : 10) : 0)
    : Math.max(colorPickerWidth, colorSwatchPanelWidth);
  const temperatureGradientDirection = temperatureSettings.orientation === 'vertical' ? 'to top' : 'to right';
  const temperatureGradient =
    `linear-gradient(${temperatureGradientDirection}, #f0a23a 0%, #f7c07b 22%, #f6e1cf 46%, #eef2ff 70%, #cfe0ff 100%)`;
  const colorSliderGradientDirection = colorSliderSettings.orientation === 'vertical' ? 'to top' : 'to right';
  const colorGradient = `linear-gradient(${colorSliderGradientDirection}, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)`;
  const lightHex = rgbToHex(lightRgb);

  if (selectedModuleForDevice === 'light-icon-only' && assignedEntity) {
    return renderModuleSurface(
      moduleHeading,
      iconSettings.showHeader,
      {
        padding: iconSettings.cardPadding,
        minWidth: iconSettings.cardMinWidth,
        boxShadow: iconSettings.showShadow ? moduleSurfaceStyle.boxShadow : theme.tokens.shadow.none,
        gap: iconSettings.compactMode ? 6 : 10,
      },
      <>
        {!iconSettings.compactMode && <SectionLabel>Power</SectionLabel>}
        <PrimaryControl
          style={{
            justifyContent: iconSettings.layout === 'horizontal' ? 'space-between' : 'center',
            gap: iconSettings.mobileMode ? 12 : 8,
            flexDirection: iconSettings.layout === 'horizontal' ? 'row' : 'column',
          }}
        >
          <button
            type="button"
            disabled={lightCommandBusy}
            onClick={onToggleLight}
            style={{
              border: 0,
              background: 'transparent',
              cursor: lightCommandBusy ? 'wait' : 'pointer',
              color: isLightOn ? iconSettings.iconOnColor : iconSettings.iconOffColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              lineHeight: 1,
            }}
            aria-label="Toggle light"
          >
            {isLightOn ? (
              <LightbulbIcon sx={{ fontSize: iconSettings.mobileMode ? iconSettings.iconSize + 8 : iconSettings.iconSize }} />
            ) : (
              <LightbulbOutlineIcon sx={{ fontSize: iconSettings.mobileMode ? iconSettings.iconSize + 8 : iconSettings.iconSize }} />
            )}
          </button>
          {iconSettings.showStatusText && (
            <SectionValue>
              <SecondaryControl>
                <StatusIndicator style={{ background: isLightOn ? iconSettings.iconOnColor : iconSettings.iconOffColor }} />
                <span>{isLightOn ? iconSettings.statusOnText : iconSettings.statusOffText}</span>
              </SecondaryControl>
            </SectionValue>
          )}
        </PrimaryControl>
      </>,
      undefined,
      <StatusIndicator style={{ background: isLightOn ? iconSettings.iconOnColor : iconSettings.iconOffColor }} />
    );
  }

  if (selectedModuleForDevice === 'light-temperature-slider' && assignedEntity) {
    return renderModuleSurface(
      moduleHeading,
      temperatureSettings.showHeader,
      {
        padding: temperatureSettings.cardPadding,
        minWidth: temperatureSettings.cardMinWidth,
        boxShadow: temperatureSettings.showShadow ? moduleSurfaceStyle.boxShadow : theme.tokens.shadow.none,
        gap: temperatureSettings.compactMode ? 6 : 10,
      },
      <>
        {!temperatureSettings.compactMode && <SectionLabel>Temperature</SectionLabel>}
        {temperatureSettings.showPresetLabel && <SectionValue style={{ marginTop: -2 }}>{getTemperatureLabel(boundedTemperature)}</SectionValue>}
        <Slider
          value={boundedTemperature}
          min={temperatureMin}
          max={temperatureMax}
          step={temperatureStep}
          orientation={temperatureSettings.orientation}
          disabled={lightCommandBusy}
          valueLabelDisplay={temperatureSettings.valueLabelDisplay}
          track={false}
          onChange={(_, value) => onTemperatureInput(clampNumber(Array.isArray(value) ? value[0] : value, temperatureMin, temperatureMax))}
          onChangeCommitted={(_, value) => onTemperatureCommit(clampNumber(Array.isArray(value) ? value[0] : value, temperatureMin, temperatureMax))}
          sx={{
            ...sliderBaseSx,
            ...sliderSlotSx,
            width: temperatureSettings.orientation === 'horizontal' ? '100%' : (temperatureSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness),
            height: temperatureSettings.orientation === 'vertical' ? (temperatureSettings.mobileMode ? 180 : 150) : (temperatureSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness),
            color: temperatureSettings.accentColor,
            '& .MuiSlider-thumb': {
              display: 'flex',
              width: (temperatureSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness) - 4,
              height: (temperatureSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness) - 4,
              left: temperatureSettings.orientation === 'vertical' ? '50%' : undefined,
              top: temperatureSettings.orientation === 'horizontal' ? '50%' : undefined,
              transform: temperatureSettings.orientation === 'vertical' ? 'translateX(-50%)' : 'translateY(-50%)',
              border: '2px solid #fff',
              boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
            },
            '& .MuiSlider-rail': {
              opacity: 1,
              background: temperatureSettings.railStyle === 'gradient' ? temperatureGradient : temperatureSettings.accentColor,
            },
          }}
        />
        {temperatureSettings.showKelvinValue && <SectionValue>{Math.round(boundedTemperature)}K</SectionValue>}
      </>
    );
  }

  if (selectedModuleForDevice === 'light-color-slider' && assignedEntity) {
    const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s, l = (max + min) / 2;
      if (max === min) { h = s = 0; }
      else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return [h * 360, s * 100, l * 100];
    };

    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
      h /= 360; s /= 100; l /= 100;
      let r, g, b;
      if (s === 0) { r = g = b = l; }
      else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    const [currentHue] = rgbToHsl(...lightRgb);

    return renderModuleSurface(
      moduleHeading,
      colorSliderSettings.showHeader,
      {
        padding: colorSliderSettings.cardPadding,
        minWidth: colorSliderSettings.cardMinWidth,
        boxShadow: colorSliderSettings.showShadow ? moduleSurfaceStyle.boxShadow : theme.tokens.shadow.none,
        gap: colorSliderSettings.compactMode ? 6 : 10,
      },
      <>
        {!colorSliderSettings.compactMode && <SectionLabel>Color</SectionLabel>}
        <Slider
          value={currentHue}
          min={0}
          max={360}
          step={1}
          orientation={colorSliderSettings.orientation}
          disabled={lightCommandBusy}
          valueLabelDisplay="off"
          track={false}
          onChange={(_, value) => {
            const h = Array.isArray(value) ? value[0] : value;
            onRgbInput(hslToRgb(h, 100, 50));
          }}
          onChangeCommitted={(_, value) => {
            const h = Array.isArray(value) ? value[0] : value;
            onColorCommit(hslToRgb(h, 100, 50));
          }}
          sx={{
            ...sliderBaseSx,
            ...sliderSlotSx,
            width: colorSliderSettings.orientation === 'horizontal' ? '100%' : (colorSliderSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness),
            height: colorSliderSettings.orientation === 'vertical' ? (colorSliderSettings.mobileMode ? 180 : 150) : (colorSliderSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness),
            display: 'inline-flex',
            margin: colorSliderSettings.orientation === 'vertical' ? '0 auto' : 0,
            color: 'transparent',
            '& .MuiSlider-thumb': {
              display: 'flex',
              width: (colorSliderSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness) - 4,
              height: (colorSliderSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness) - 4,
              left: colorSliderSettings.orientation === 'vertical' ? '50% !important' : undefined,
              transform: colorSliderSettings.orientation === 'vertical' ? 'translateX(-50%)' : 'translate(-50%, -50%)',
              top: colorSliderSettings.orientation === 'horizontal' ? '50%' : undefined,
              border: '2px solid #fff',
              boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
              backgroundColor: lightHex,
            },
            '& .MuiSlider-rail': {
              opacity: 1,
              background: colorGradient,
            },
          }}
        />
        {colorSliderSettings.showHexValue && (
          <SectionValue>
            <SecondaryControl>
              <span>{lightHex.toUpperCase()}</span>
              <StatusIndicator style={{ background: lightHex, border: '1px solid #94a3b8' }} />
            </SecondaryControl>
          </SectionValue>
        )}
      </>
    );
  }

  if (selectedModuleForDevice === 'light-brightness-slider' && assignedEntity) {
    return renderModuleSurface(
      moduleHeading,
      brightnessSettings.showHeader,
      {
        padding: brightnessSettings.cardPadding,
        minWidth: brightnessSettings.cardMinWidth,
        boxShadow: brightnessSettings.showShadow ? moduleSurfaceStyle.boxShadow : theme.tokens.shadow.none,
        gap: brightnessSettings.compactMode ? 6 : 10,
      },
      <>
        {!brightnessSettings.compactMode && <SectionLabel>Level</SectionLabel>}
        <Slider
          value={boundedBrightness}
          min={brightnessMin}
          max={brightnessMax}
          step={brightnessStep}
          orientation={brightnessSettings.orientation}
          disabled={lightCommandBusy}
          valueLabelDisplay={brightnessSettings.valueLabelDisplay}
          onChange={(_, value) => onBrightnessInput(clampNumber(Array.isArray(value) ? value[0] : value, brightnessMin, brightnessMax))}
          onChangeCommitted={(_, value) => onBrightnessCommit(clampNumber(Array.isArray(value) ? value[0] : value, brightnessMin, brightnessMax))}
          sx={{
            ...sliderBaseSx,
            ...sliderSlotSx,
            width: brightnessSettings.orientation === 'horizontal' ? '100%' : (brightnessSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness),
            height: brightnessSettings.orientation === 'vertical' ? (brightnessSettings.mobileMode ? 180 : 150) : (brightnessSettings.mobileMode ? theme.tokens.slider.railThicknessMobile : theme.tokens.slider.railThickness),
            display: 'inline-flex',
            margin: brightnessSettings.orientation === 'vertical' ? '0 auto' : 0,
            color: brightnessSettings.trackColor,
            '& .MuiSlider-thumb': { display: 'none' },
            '& .MuiSlider-rail': {
              opacity: 1,
              background: brightnessSettings.railColor,
            },
            '& .MuiSlider-track': {
              background: brightnessSettings.trackColor,
            },
          }}
        />
        {brightnessSettings.showPercentValue && <SectionValue>{Math.round(boundedBrightness)}%</SectionValue>}
      </>
    );
  }

  if (selectedModuleForDevice === 'light-color-wheel' && assignedEntity) {
    return renderModuleSurface(
      moduleHeading,
      colorSettings.showHeader,
      {
        padding: colorSettings.cardPadding,
        minWidth: Math.max(colorSettings.cardMinWidth, colorContentWidth),
        boxShadow: colorSettings.showShadow ? moduleSurfaceStyle.boxShadow : theme.tokens.shadow.none,
        gap: colorSettings.compactMode ? 6 : 10,
      },
      <>
        {!colorSettings.compactMode && <SectionLabel>Color</SectionLabel>}
        <PrimaryControl
          style={{
            width: '100%',
            flexDirection: colorSettings.layout === 'picker-left' ? 'row' : 'column',
            gap: colorSettings.compactMode ? 6 : 10,
          }}
        >
          <PickerSurface
            style={{
              width: colorPickerWidth,
              pointerEvents: lightCommandBusy ? 'none' : 'auto',
              opacity: lightCommandBusy ? 0.6 : 1,
            }}
          >
            <SliderPicker
              color={lightHex}
              onChange={(color: ColorResult) => onRgbInput([color.rgb.r, color.rgb.g, color.rgb.b])}
              onChangeComplete={(color: ColorResult) => onColorCommit([color.rgb.r, color.rgb.g, color.rgb.b])}
            />
          </PickerSurface>
          {colorSettings.showSwatches && (
            <SwatchGrid
              style={{
                gridTemplateColumns: `repeat(${colorSwatchColumns}, 1fr)`,
                gap: colorSwatchGap,
                width: colorSettings.layout === 'picker-left' ? colorSwatchPanelWidth : '100%',
              }}
            >
              {LIGHT_COLOR_SWATCHES.map((swatchHex) => (
                <SwatchItem
                  key={swatchHex}
                  type="button"
                  onClick={() => {
                    const nextRgb = hexToRgb(swatchHex);
                    onRgbInput(nextRgb);
                    if (colorSettings.allowSwatchCommands) onColorCommit(nextRgb);
                  }}
                  disabled={lightCommandBusy}
                  style={{
                    width: colorSwatchSize,
                    height: colorSwatchSize,
                    border: `1px solid ${lightHex.toLowerCase() === swatchHex.toLowerCase() ? '#0f172a' : '#cbd5e1'}`,
                    background: swatchHex,
                  }}
                  aria-label={`Set color ${swatchHex}`}
                />
              ))}
            </SwatchGrid>
          )}
        </PrimaryControl>
      </>,
      colorSettings.showHexValue ? (
        <SectionValue>
          <SecondaryControl>
            <span>{lightHex.toUpperCase()}</span>
            <StatusIndicator
              style={{
                width: clampNumber(colorSettings.previewDotSize, 6, 20),
                height: clampNumber(colorSettings.previewDotSize, 6, 20),
                border: '1px solid #94a3b8',
                background: lightHex,
              }}
            />
          </SecondaryControl>
        </SectionValue>
      ) : undefined
    );
  }

  if (selectedModuleForDevice === 'light-info-card') {
    return renderModuleSurface(
      moduleHeading,
      infoCardSettings.showHeader,
      {
        padding: infoCardSettings.cardPadding,
        minWidth: infoCardSettings.cardMinWidth,
        boxShadow: infoCardSettings.showShadow ? moduleSurfaceStyle.boxShadow : theme.tokens.shadow.none,
        gap: infoCardSettings.rowGap,
      },
      <>
        {!infoCardSettings.compactMode && <SectionLabel>State</SectionLabel>}
        <InfoGrid
          style={{
            gridTemplateColumns: infoCardSettings.layout === 'two-column' ? '1fr 1fr' : '1fr',
            gap: infoCardSettings.rowGap,
          }}
        >
          {infoCardSettings.showStatus && (
            <InfoRow>
              <InfoKey style={{ textTransform: infoCardSettings.labelCase }}>{'Status'}</InfoKey>
              <InfoValue style={{ fontWeight: infoCardSettings.valueWeight }}>
                <StatusIndicator style={{ background: isLightOn ? '#10b981' : '#64748b' }} />
                <span>{isLightOn ? 'On' : 'Off'}</span>
              </InfoValue>
            </InfoRow>
          )}
          {infoCardSettings.showBrightness && (
            <InfoRow>
              <InfoKey style={{ textTransform: infoCardSettings.labelCase }}>{'Brightness'}</InfoKey>
              <InfoValue style={{ fontWeight: infoCardSettings.valueWeight }}>
                {typeof lightBrightnessValue === 'number'
                  ? `${Math.round(lightBrightnessValue)}%`
                  : <FallbackText>{infoCardSettings.fallbackText}</FallbackText>}
              </InfoValue>
            </InfoRow>
          )}
          {infoCardSettings.showTemperature && (
            <InfoRow>
              <InfoKey style={{ textTransform: infoCardSettings.labelCase }}>{'Temperature'}</InfoKey>
              <InfoValue style={{ fontWeight: infoCardSettings.valueWeight }}>
                {typeof lightTemperatureValue === 'number'
                  ? `${Math.round(lightTemperatureValue)}K`
                  : <FallbackText>{infoCardSettings.fallbackText}</FallbackText>}
              </InfoValue>
            </InfoRow>
          )}
          {infoCardSettings.showColor && (
            <InfoRow>
              <InfoKey style={{ textTransform: infoCardSettings.labelCase }}>{'Color'}</InfoKey>
              <InfoValue style={{ fontWeight: infoCardSettings.valueWeight }}>
                {lightHexValue || <FallbackText>{infoCardSettings.fallbackText}</FallbackText>}
                {infoCardSettings.showColorDot && lightHexValue && (
                  <StatusIndicator
                    style={{
                      width: infoCardSettings.mobileMode ? 12 : 10,
                      height: infoCardSettings.mobileMode ? 12 : 10,
                      background: lightHexValue,
                      border: '1px solid #94a3b8',
                    }}
                  />
                )}
              </InfoValue>
            </InfoRow>
          )}
        </InfoGrid>
      </>
    );
  }

  if (selectedModuleForDevice?.startsWith('light-')) {
    return <ErrorState>Unsupported light module: {selectedModuleForDevice}</ErrorState>;
  }

  return <EmptyState>{baseTitle} block</EmptyState>;
}
