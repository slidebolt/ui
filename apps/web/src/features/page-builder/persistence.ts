import type {
  LightBrightnessSettings,
  LightColorSettings,
  LightColorSliderSettings,
  LightIconOnlySettings,
  LightInfoCardSettings,
  LightTemperatureSettings,
} from './moduleSettings';
import type { AvailableEntity, BuilderModuleType, CanvasItem } from './types';

export const PAGE_BUILDER_STORAGE_KEY = 'page-builder.saved-pages.v1';
export const PAGE_BUILDER_PAGE_VERSION = 1;

export interface PageBuilderPersistedState {
  items: CanvasItem[];
  selectedEntitiesByItemId: Record<string, AvailableEntity>;
  selectedModulesByItemId: Record<string, BuilderModuleType | undefined>;
  lightIconOnlySettingsByItemId: Record<string, LightIconOnlySettings>;
  lightTemperatureSettingsByItemId: Record<string, LightTemperatureSettings>;
  lightBrightnessSettingsByItemId: Record<string, LightBrightnessSettings>;
  lightColorSliderSettingsByItemId: Record<string, LightColorSliderSettings>;
  lightColorSettingsByItemId: Record<string, LightColorSettings>;
  lightInfoCardSettingsByItemId: Record<string, LightInfoCardSettings>;
}

export interface PageBuilderSavedPage {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  state: PageBuilderPersistedState;
}

export interface PageBuilderStorageResult {
  pages: PageBuilderSavedPage[];
  error: string | null;
}

export const readSavedPagesFromStorage = (): PageBuilderStorageResult => {
  if (typeof window === 'undefined') return { pages: [], error: null };
  const raw = window.localStorage.getItem(PAGE_BUILDER_STORAGE_KEY);
  if (!raw) return { pages: [], error: null };

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { pages: [], error: 'Saved page data is invalid.' };
    }
    return { pages: parsed as PageBuilderSavedPage[], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    return { pages: [], error: `Unable to parse saved pages: ${message}` };
  }
};

export const writeSavedPagesToStorage = (pages: PageBuilderSavedPage[]): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    window.localStorage.setItem(PAGE_BUILDER_STORAGE_KEY, JSON.stringify(pages));
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown write error';
    return `Unable to save pages: ${message}`;
  }
};
