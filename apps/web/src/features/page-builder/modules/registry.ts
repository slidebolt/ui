import type { DeviceType } from '../types';
import { cameraModuleOptions } from './camera';
import { coverModuleOptions } from './cover';
import { lightModuleOptions } from './light';
import { sensorModuleOptions } from './sensor';
import type { EntityModuleCatalog, ModuleOption } from './sdk/types';
import { switchModuleOptions } from './switch';

const MODULE_CATALOG: EntityModuleCatalog = {
  light: lightModuleOptions,
  sensor: sensorModuleOptions,
  switch: switchModuleOptions,
  cover: coverModuleOptions,
  camera: cameraModuleOptions,
};

export const getAvailableModulesForDeviceType = (deviceType: DeviceType): ModuleOption[] =>
  MODULE_CATALOG[deviceType] || [];
