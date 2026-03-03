import type { PageBuilderSlotStyles } from '../slots';
import type { PageBuilderThemeTokens } from '../tokens';

const tokens: PageBuilderThemeTokens = {
  colors: {
    surface: '#ffffff',
    surfaceSubtle: '#f8fafc',
    border: '#dbe5ef',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    status: {
      busy: '#f59e0b',
      error: '#b91c1c',
      disabled: '#94a3b8',
    },
  },
  radius: {
    card: 12,
    control: 8,
    chip: 999,
  },
  spacing: {
    cardPadding: 12,
    cardGap: 10,
    compactGap: 6,
  },
  typography: {
    labelSize: 12,
    valueSize: 12,
    headerSize: 13,
  },
  shadow: {
    module: '0 2px 8px rgba(15, 23, 42, 0.08)',
    none: 'none',
  },
  slider: {
    thumbSize: 16,
    railThickness: 32,
    railThicknessMobile: 40,
    valueLabelRadius: 6,
  },
};

const slots: PageBuilderSlotStyles = {
  ModuleFrame: {
    position: 'relative',
  },
  ModuleSurface: {
    width: 'fit-content',
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.cardPadding,
    display: 'grid',
    gap: tokens.spacing.cardGap,
    background: tokens.colors.surface,
    boxShadow: tokens.shadow.module,
    position: 'relative',
  },
  ModuleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  ModuleHeaderIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    color: tokens.colors.textSecondary,
    lineHeight: 1,
  },
  ModuleHeaderTitle: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.headerSize,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  ModuleBody: {
    display: 'grid',
    gap: tokens.spacing.cardGap,
  },
  ModuleFooter: {
    borderTop: `1px solid ${tokens.colors.border}`,
    paddingTop: 8,
  },
  Section: {
    display: 'grid',
    gap: 6,
  },
  SectionLabel: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.labelSize,
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  SectionValue: {
    fontSize: tokens.typography.valueSize,
    color: '#334155',
    textAlign: 'center',
  },
  PrimaryControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  SecondaryControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  SliderTrack: {
    border: 0,
    height: '100%',
    borderRadius: 0,
  },
  SliderRail: {
    opacity: 0.4,
    border: 0,
    height: '100%',
    borderRadius: 0,
  },
  SliderThumb: {
    width: tokens.slider.thumbSize,
    height: tokens.slider.thumbSize,
    border: '2px solid #fff',
    boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
    background: tokens.colors.surface,
  },
  SliderValueLabel: {
    borderRadius: tokens.slider.valueLabelRadius,
    fontSize: 11,
  },
  PickerSurface: {
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.control,
    background: tokens.colors.surfaceSubtle,
    padding: 6,
  },
  SwatchGrid: {
    display: 'grid',
    gap: 6,
  },
  SwatchItem: {
    borderRadius: 3,
    cursor: 'pointer',
    padding: 0,
  },
  InfoGrid: {
    display: 'grid',
    gap: 6,
  },
  InfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    color: '#334155',
  },
  InfoKey: {
    color: tokens.colors.textSecondary,
    textTransform: 'uppercase',
    fontSize: tokens.typography.labelSize,
    letterSpacing: 0.2,
  },
  InfoValue: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.valueSize,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  StatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: tokens.radius.chip,
    display: 'inline-block',
  },
  EmptyState: {
    color: '#6b7280',
    fontSize: tokens.typography.valueSize,
    textAlign: 'center',
    padding: 6,
  },
  FallbackText: {
    color: tokens.colors.textSecondary,
    fontStyle: 'italic',
  },
  BusyOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.typography.valueSize,
    color: tokens.colors.status.busy,
    borderRadius: tokens.radius.card,
    pointerEvents: 'none',
    zIndex: 1,
  },
  DisabledState: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  ErrorState: {
    color: tokens.colors.status.error,
  },
};

const sliderBaseSx = {
  width: '100%',
  padding: '0 !important',
  margin: 0,
  overflow: 'hidden',
  boxSizing: 'border-box',
  border: `1px solid ${tokens.colors.border}`,
  borderRadius: tokens.radius.control,
  height: tokens.slider.railThickness,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '@media (max-width: 600px)': {
    height: tokens.slider.railThicknessMobile,
  },
  '& .MuiSlider-track': {
    border: 0,
    height: '100%',
    borderRadius: 0,
    transition: 'none',
  },
  '& .MuiSlider-rail': {
    opacity: 0.4,
    border: 0,
    height: '100%',
    borderRadius: 0,
  },
  '&.MuiSlider-vertical': {
    width: tokens.slider.railThickness,
    padding: '0 !important',
    margin: '0 auto',
    display: 'inline-flex',
    flexDirection: 'column',
    '@media (max-width: 600px)': {
      width: tokens.slider.railThicknessMobile,
    },
    '& .MuiSlider-track': {
      width: '100%',
      height: 'auto',
      border: 0,
      borderRadius: 0,
    },
    '& .MuiSlider-rail': {
      width: '100%',
      height: '100%',
      border: 0,
      borderRadius: 0,
    },
    '& .MuiSlider-thumb': {
      left: '50%',
      transform: 'translateX(-50%)',
      margin: 0,
    },
  },
  '& .MuiSlider-thumb': {
    display: 'none',
    width: tokens.slider.thumbSize,
    height: tokens.slider.thumbSize,
    border: '2px solid #fff',
    boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
    backgroundColor: '#fff',
    '&:hover, &.Mui-focusVisible': {
      boxShadow: '0 0 0 8px rgba(15,23,42,0.1)',
    },
  },
  '& .MuiSlider-valueLabel': {
    borderRadius: tokens.slider.valueLabelRadius,
    fontSize: 11,
  },
};

export const defaultPageBuilderTheme = {
  id: 'default',
  label: 'Default',
  tokens,
  slots,
  mui: {
    sliderBaseSx,
  },
};

export type PageBuilderTheme = typeof defaultPageBuilderTheme;
