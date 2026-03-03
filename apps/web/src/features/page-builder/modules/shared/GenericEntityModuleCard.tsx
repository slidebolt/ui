import {
  EmptyState,
  ModuleBody,
  ModuleFrame,
  ModuleHeader,
  ModuleHeaderTitle,
  ModuleSurface,
  Section,
  SectionLabel,
  SectionValue,
} from '../../theme';
import type { DeviceType } from '../../types';

interface GenericEntityModuleCardProps {
  title: string;
  deviceType: DeviceType;
}

export default function GenericEntityModuleCard({ title, deviceType }: GenericEntityModuleCardProps) {
  return (
    <ModuleFrame>
      <ModuleSurface onClick={(event) => event.stopPropagation()}>
        <ModuleHeader>
          <ModuleHeaderTitle>{title}</ModuleHeaderTitle>
        </ModuleHeader>
        <ModuleBody>
          <Section>
            <SectionLabel>{deviceType}</SectionLabel>
            <SectionValue>Module scaffold</SectionValue>
          </Section>
          <EmptyState>Add module implementations in this entity folder.</EmptyState>
        </ModuleBody>
      </ModuleSurface>
    </ModuleFrame>
  );
}
