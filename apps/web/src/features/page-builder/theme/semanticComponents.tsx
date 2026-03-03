import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { usePageBuilderTheme } from './ThemeProvider';
import type { PageBuilderSemanticSlot } from './slots';
import type { PageBuilderTheme } from './themes/defaultTheme';

type SlotDivProps = HTMLAttributes<HTMLDivElement> & { style?: CSSProperties; children?: ReactNode };

const mergeStyles = (...styles: Array<CSSProperties | undefined>): CSSProperties =>
  Object.assign({}, ...styles.filter(Boolean));

function SlotDiv({ semanticSlot, style, ...props }: SlotDivProps & { semanticSlot: PageBuilderSemanticSlot }) {
  const theme = usePageBuilderTheme();
  return <div {...props} style={mergeStyles(theme.slots[semanticSlot], style)} />;
}

export function ModuleFrame(props: SlotDivProps) { return <SlotDiv semanticSlot="ModuleFrame" {...props} />; }
export function ModuleSurface(props: SlotDivProps) { return <SlotDiv semanticSlot="ModuleSurface" {...props} />; }
export function ModuleHeader(props: SlotDivProps) { return <SlotDiv semanticSlot="ModuleHeader" {...props} />; }
export function ModuleHeaderIcon(props: SlotDivProps) { return <SlotDiv semanticSlot="ModuleHeaderIcon" {...props} />; }
export function ModuleHeaderTitle(props: SlotDivProps) { return <SlotDiv semanticSlot="ModuleHeaderTitle" {...props} />; }
export function ModuleBody(props: SlotDivProps) { return <SlotDiv semanticSlot="ModuleBody" {...props} />; }
export function ModuleFooter(props: SlotDivProps) { return <SlotDiv semanticSlot="ModuleFooter" {...props} />; }
export function Section(props: SlotDivProps) { return <SlotDiv semanticSlot="Section" {...props} />; }
export function SectionLabel(props: SlotDivProps) { return <SlotDiv semanticSlot="SectionLabel" {...props} />; }
export function SectionValue(props: SlotDivProps) { return <SlotDiv semanticSlot="SectionValue" {...props} />; }
export function PrimaryControl(props: SlotDivProps) { return <SlotDiv semanticSlot="PrimaryControl" {...props} />; }
export function SecondaryControl(props: SlotDivProps) { return <SlotDiv semanticSlot="SecondaryControl" {...props} />; }
export function PickerSurface(props: SlotDivProps) { return <SlotDiv semanticSlot="PickerSurface" {...props} />; }
export function SwatchGrid(props: SlotDivProps) { return <SlotDiv semanticSlot="SwatchGrid" {...props} />; }
export function InfoGrid(props: SlotDivProps) { return <SlotDiv semanticSlot="InfoGrid" {...props} />; }
export function InfoRow(props: SlotDivProps) { return <SlotDiv semanticSlot="InfoRow" {...props} />; }
export function InfoKey(props: SlotDivProps) { return <SlotDiv semanticSlot="InfoKey" {...props} />; }
export function InfoValue(props: SlotDivProps) { return <SlotDiv semanticSlot="InfoValue" {...props} />; }
export function StatusIndicator(props: SlotDivProps) { return <SlotDiv semanticSlot="StatusIndicator" {...props} />; }
export function EmptyState(props: SlotDivProps) { return <SlotDiv semanticSlot="EmptyState" {...props} />; }
export function FallbackText(props: SlotDivProps) { return <SlotDiv semanticSlot="FallbackText" {...props} />; }
export function BusyOverlay(props: SlotDivProps) { return <SlotDiv semanticSlot="BusyOverlay" {...props} />; }
export function DisabledState(props: SlotDivProps) { return <SlotDiv semanticSlot="DisabledState" {...props} />; }
export function ErrorState(props: SlotDivProps) { return <SlotDiv semanticSlot="ErrorState" {...props} />; }

export function SwatchItem({
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { style?: CSSProperties }) {
  const theme = usePageBuilderTheme();
  return <button {...props} style={mergeStyles(theme.slots.SwatchItem, style)} />;
}

export const getSliderSlotSx = (theme: PageBuilderTheme) => ({
  '& .MuiSlider-track': { ...theme.slots.SliderTrack },
  '& .MuiSlider-rail': { ...theme.slots.SliderRail },
  '& .MuiSlider-thumb': { ...theme.slots.SliderThumb },
  '& .MuiSlider-valueLabel': { ...theme.slots.SliderValueLabel },
});
