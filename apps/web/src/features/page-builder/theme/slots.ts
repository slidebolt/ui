import type { CSSProperties } from 'react';

export type PageBuilderSemanticSlot =
  | 'ModuleFrame'
  | 'ModuleSurface'
  | 'ModuleHeader'
  | 'ModuleHeaderIcon'
  | 'ModuleHeaderTitle'
  | 'ModuleBody'
  | 'ModuleFooter'
  | 'Section'
  | 'SectionLabel'
  | 'SectionValue'
  | 'PrimaryControl'
  | 'SecondaryControl'
  | 'SliderTrack'
  | 'SliderRail'
  | 'SliderThumb'
  | 'SliderValueLabel'
  | 'PickerSurface'
  | 'SwatchGrid'
  | 'SwatchItem'
  | 'InfoGrid'
  | 'InfoRow'
  | 'InfoKey'
  | 'InfoValue'
  | 'StatusIndicator'
  | 'EmptyState'
  | 'FallbackText'
  | 'BusyOverlay'
  | 'DisabledState'
  | 'ErrorState';

export type PageBuilderSlotStyles = Record<PageBuilderSemanticSlot, CSSProperties>;
