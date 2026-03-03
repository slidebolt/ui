import type { ModuleOption } from '../sdk/types';
import { lightBrightnessSliderModule } from './brightness-slider';
import { lightColorSliderModule } from './color-slider';
import { lightColorWheelModule } from './color-wheel';
import { lightIconOnlyModule } from './icon-only';
import { lightInfoCardModule } from './info-card';
import { lightTemperatureSliderModule } from './temperature-slider';

export const lightModuleOptions: ModuleOption[] = [
  lightIconOnlyModule,
  lightTemperatureSliderModule,
  lightBrightnessSliderModule,
  lightColorSliderModule,
  lightColorWheelModule,
  lightInfoCardModule,
];
