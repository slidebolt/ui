import type { BuilderModuleType, DeviceType } from '../../types';

export interface ModuleOption {
  value: BuilderModuleType;
  label: string;
}

export type EntityModuleCatalog = Partial<Record<DeviceType, ModuleOption[]>>;
