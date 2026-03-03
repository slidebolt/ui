import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ViewStreamOutlinedIcon from '@mui/icons-material/ViewStreamOutlined';
import ViewWeekOutlinedIcon from '@mui/icons-material/ViewWeekOutlined';
import {
  DRAG_MIME_TYPE,
} from './constants';
import {
  PAGE_BUILDER_PAGE_VERSION,
  readSavedPagesFromStorage,
  type PageBuilderPersistedState,
  type PageBuilderSavedPage,
  writeSavedPagesToStorage,
} from './persistence';
import { getAvailableModulesForDeviceType } from './modules/registry';
import LightModuleCardContent, { getLightModuleMinWidth } from './modules/light/LightModuleCardContent';
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
} from './moduleSettings';
import type {
  AvailableEntity,
  BuilderModuleType,
  CanvasItem,
  DeviceItem,
  DeviceType,
  DragPayload,
  ItemLocation,
  PaletteItemType,
  RowItem,
} from './types';
import LightModuleSettingsPanel from './modules/light/LightModuleSettingsPanel';
import { PageBuilderThemeProvider } from './theme';
import GenericEntityModuleCard from './modules/shared/GenericEntityModuleCard';

function PageBuilder() {
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [viewMode, setViewMode] = useState<'editor' | 'runtime'>('editor');
  const [detailsTab, setDetailsTab] = useState<'binding' | 'module'>('binding');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [entitySearch, setEntitySearch] = useState('');
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [selectedEntitiesByItemId, setSelectedEntitiesByItemId] = useState<Record<string, AvailableEntity>>({});
  const [selectedModulesByItemId, setSelectedModulesByItemId] = useState<Record<string, BuilderModuleType | undefined>>({});
  const [lightIconOnlySettingsByItemId, setLightIconOnlySettingsByItemId] =
    useState<Record<string, LightIconOnlySettings>>({});
  const [lightTemperatureSettingsByItemId, setLightTemperatureSettingsByItemId] =
    useState<Record<string, LightTemperatureSettings>>({});
  const [lightBrightnessSettingsByItemId, setLightBrightnessSettingsByItemId] =
    useState<Record<string, LightBrightnessSettings>>({});
  const [lightColorSliderSettingsByItemId, setLightColorSliderSettingsByItemId] =
    useState<Record<string, LightColorSliderSettings>>({});
  const [lightColorSettingsByItemId, setLightColorSettingsByItemId] =
    useState<Record<string, LightColorSettings>>({});
  const [lightInfoCardSettingsByItemId, setLightInfoCardSettingsByItemId] =
    useState<Record<string, LightInfoCardSettings>>({});
  const [lightPowerByItemId, setLightPowerByItemId] = useState<Record<string, boolean>>({});
  const [lightTemperatureByItemId, setLightTemperatureByItemId] = useState<Record<string, number>>({});
  const [lightBrightnessByItemId, setLightBrightnessByItemId] = useState<Record<string, number>>({});
  const [lightRgbByItemId, setLightRgbByItemId] = useState<Record<string, [number, number, number]>>({});
  const [lightCommandBusyByItemId, setLightCommandBusyByItemId] = useState<Record<string, boolean>>({});
  const [savedPages, setSavedPages] = useState<PageBuilderSavedPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedSavedPageId, setSelectedSavedPageId] = useState('');
  const [pageName, setPageName] = useState('Untitled Page');
  const [pageStorageError, setPageStorageError] = useState<string | null>(null);
  const idCounter = useRef(0);
  const activeDragPayload = useRef<DragPayload | null>(null);
  const pendingLightRefreshTimer = useRef<number | null>(null);
  const isEditorMode = viewMode === 'editor';

  const nextId = (prefix: string) => {
    idCounter.current += 1;
    return `${prefix}-${Date.now()}-${idCounter.current}`;
  };

  const nextPageId = () =>
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `page-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

  const buildPersistedState = (): PageBuilderPersistedState => ({
    items,
    selectedEntitiesByItemId,
    selectedModulesByItemId,
    lightIconOnlySettingsByItemId,
    lightTemperatureSettingsByItemId,
    lightBrightnessSettingsByItemId,
    lightColorSliderSettingsByItemId,
    lightColorSettingsByItemId,
    lightInfoCardSettingsByItemId,
  });

  const applyPersistedState = (state: PageBuilderPersistedState) => {
    setItems(state.items || []);
    setSelectedEntitiesByItemId(state.selectedEntitiesByItemId || {});
    setSelectedModulesByItemId(state.selectedModulesByItemId || {});
    setLightIconOnlySettingsByItemId(state.lightIconOnlySettingsByItemId || {});
    setLightTemperatureSettingsByItemId(state.lightTemperatureSettingsByItemId || {});
    setLightBrightnessSettingsByItemId(state.lightBrightnessSettingsByItemId || {});
    setLightColorSliderSettingsByItemId(state.lightColorSliderSettingsByItemId || {});
    setLightColorSettingsByItemId(state.lightColorSettingsByItemId || {});
    setLightInfoCardSettingsByItemId(state.lightInfoCardSettingsByItemId || {});
    setLightPowerByItemId({});
    setLightTemperatureByItemId({});
    setLightBrightnessByItemId({});
    setLightRgbByItemId({});
    setLightCommandBusyByItemId({});
    setSelectedItemId(null);
    setShowEntityPicker(false);
    setEntitySearch('');
  };

  const persistSavedPages = (pages: PageBuilderSavedPage[]): boolean => {
    const error = writeSavedPagesToStorage(pages);
    if (error) {
      setPageStorageError(error);
      return false;
    }
    setSavedPages(pages);
    setPageStorageError(null);
    return true;
  };

  const savePage = (asNew: boolean) => {
    const trimmedName = pageName.trim() || 'Untitled Page';
    const now = new Date().toISOString();
    const resolvedPageId = asNew || !activePageId ? nextPageId() : activePageId;
    const existingPage = savedPages.find((page) => page.id === resolvedPageId);
    const pageToSave: PageBuilderSavedPage = {
      id: resolvedPageId,
      name: trimmedName,
      createdAt: existingPage?.createdAt || now,
      updatedAt: now,
      version: PAGE_BUILDER_PAGE_VERSION,
      state: buildPersistedState(),
    };
    const nextPages = existingPage
      ? savedPages.map((page) => (page.id === resolvedPageId ? pageToSave : page))
      : [...savedPages, pageToSave];

    if (!persistSavedPages(nextPages)) return;
    setActivePageId(resolvedPageId);
    setSelectedSavedPageId(resolvedPageId);
    setPageName(trimmedName);
  };

  const loadSelectedPage = (renderAfterLoad: boolean) => {
    if (!selectedSavedPageId) return;
    const selectedPage = savedPages.find((page) => page.id === selectedSavedPageId);
    if (!selectedPage) {
      setPageStorageError('Selected page was not found.');
      return;
    }
    applyPersistedState(selectedPage.state);
    setActivePageId(selectedPage.id);
    setPageName(selectedPage.name);
    setViewMode(renderAfterLoad ? 'runtime' : 'editor');
    setPageStorageError(null);
  };

  const createNewPage = () => {
    applyPersistedState({
      items: [],
      selectedEntitiesByItemId: {},
      selectedModulesByItemId: {},
      lightIconOnlySettingsByItemId: {},
      lightTemperatureSettingsByItemId: {},
      lightBrightnessSettingsByItemId: {},
      lightColorSliderSettingsByItemId: {},
      lightColorSettingsByItemId: {},
      lightInfoCardSettingsByItemId: {},
    });
    setActivePageId(null);
    setSelectedSavedPageId('');
    setPageName('Untitled Page');
    setViewMode('editor');
    setPageStorageError(null);
  };

  const onPaletteDragStart = (event: DragEvent<HTMLDivElement>, itemType: PaletteItemType) => {
    const payload: DragPayload = { source: 'palette', itemType };
    activeDragPayload.current = payload;
    event.dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copyMove';
  };

  const onItemDragStart = (event: DragEvent<HTMLDivElement>, itemId: string) => {
    const payload: DragPayload = { source: 'canvas', itemId };
    activeDragPayload.current = payload;
    event.dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    activeDragPayload.current = null;
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = activeDragPayload.current?.source === 'palette' ? 'copy' : 'move';
  };

  const createDevice = (deviceType: DeviceType): DeviceItem => ({
    id: nextId('device'),
    type: 'device',
    deviceType,
  });

  const createRow = (direction: 'horizontal' | 'vertical'): RowItem => ({
    id: nextId('row'),
    type: 'row',
    direction,
    children: [],
  });

  const createItemFromPalette = (itemType: PaletteItemType): CanvasItem | null => {
    if (itemType === 'row-horizontal') return createRow('horizontal');
    if (itemType === 'row-vertical') return createRow('vertical');
    if (itemType === 'device-light') return createDevice('light');
    if (itemType === 'device-switch') return createDevice('switch');
    if (itemType === 'device-sensor') return createDevice('sensor');
    if (itemType === 'device-camera') return createDevice('camera');
    if (itemType === 'device-cover') return createDevice('cover');
    return null;
  };

  const getDragPayload = (event: DragEvent<HTMLElement>): DragPayload | null => {
    if (activeDragPayload.current) return activeDragPayload.current;
    const raw = event.dataTransfer.getData(DRAG_MIME_TYPE);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as DragPayload;
      if (
        parsed.source === 'palette' &&
        [
          'row-horizontal',
          'row-vertical',
          'device-light',
          'device-switch',
          'device-sensor',
          'device-camera',
          'device-cover',
        ].includes(parsed.itemType)
      ) {
        return parsed;
      }
      if (parsed.source === 'canvas' && typeof parsed.itemId === 'string') return parsed;
    } catch {
      return null;
    }

    return null;
  };

  const containsItemId = (item: CanvasItem, targetId: string): boolean => {
    if (item.id === targetId) return true;
    if (item.type !== 'row') return false;
    return item.children.some((child) => containsItemId(child, targetId));
  };

  const findItemLocation = (
    current: CanvasItem[],
    targetId: string,
    parentId: string | null = null
  ): ItemLocation | null => {
    for (let index = 0; index < current.length; index += 1) {
      const item = current[index];
      if (item.id === targetId) return { parentId, index };
      if (item.type === 'row') {
        const nested = findItemLocation(item.children, targetId, item.id);
        if (nested) return nested;
      }
    }
    return null;
  };

  const findItemById = (current: CanvasItem[], targetId: string): CanvasItem | null => {
    for (const item of current) {
      if (item.id === targetId) return item;
      if (item.type === 'row') {
        const nested = findItemById(item.children, targetId);
        if (nested) return nested;
      }
    }
    return null;
  };

  const getItemTitle = (item: CanvasItem): string => {
    if (item.type === 'row') {
      return item.direction === 'horizontal' ? 'Horizontal row' : 'Vertical row';
    }

    const titleByType: Record<DeviceType, string> = {
      light: 'Light',
      switch: 'Switch',
      sensor: 'Sensor',
      camera: 'Camera',
      cover: 'Cover',
    };
    return titleByType[item.deviceType];
  };

  const domainMatchesDeviceType = (domain: string | undefined, deviceType: DeviceType): boolean => {
    if (!domain) return false;
    if (deviceType === 'sensor') return domain === 'sensor' || domain.startsWith('sensor.');
    return domain === deviceType;
  };

  const getEntityLabel = (entity: AvailableEntity): string => entity.local_name || entity.name || entity.id;

  const selectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setDetailsTab('binding');
    const item = findItemById(items, itemId);
    if (!item || item.type !== 'device') {
      setShowEntityPicker(false);
      setEntitySearch('');
      return;
    }
    setShowEntityPicker(!selectedEntitiesByItemId[itemId]);
    setEntitySearch('');
  };

  const selectedItem = useMemo(
    () => (selectedItemId ? findItemById(items, selectedItemId) : null),
    [items, selectedItemId]
  );
  const selectedDevice = selectedItem?.type === 'device' ? selectedItem : null;
  const selectedEntity = selectedDevice ? selectedEntitiesByItemId[selectedDevice.id] : undefined;
  const selectedModule = selectedDevice ? selectedModulesByItemId[selectedDevice.id] : undefined;
  const selectedLightIconOnlySettings = selectedDevice
    ? { ...DEFAULT_LIGHT_ICON_ONLY_SETTINGS, ...(lightIconOnlySettingsByItemId[selectedDevice.id] || {}) }
    : DEFAULT_LIGHT_ICON_ONLY_SETTINGS;
  const selectedLightTemperatureSettings = selectedDevice
    ? { ...DEFAULT_LIGHT_TEMPERATURE_SETTINGS, ...(lightTemperatureSettingsByItemId[selectedDevice.id] || {}) }
    : DEFAULT_LIGHT_TEMPERATURE_SETTINGS;
  const selectedLightBrightnessSettings = selectedDevice
    ? { ...DEFAULT_LIGHT_BRIGHTNESS_SETTINGS, ...(lightBrightnessSettingsByItemId[selectedDevice.id] || {}) }
    : DEFAULT_LIGHT_BRIGHTNESS_SETTINGS;
  const selectedLightColorSliderSettings = selectedDevice
    ? { ...DEFAULT_LIGHT_COLOR_SLIDER_SETTINGS, ...(lightColorSliderSettingsByItemId[selectedDevice.id] || {}) }
    : DEFAULT_LIGHT_COLOR_SLIDER_SETTINGS;
  const selectedLightColorSettings = selectedDevice
    ? { ...DEFAULT_LIGHT_COLOR_SETTINGS, ...(lightColorSettingsByItemId[selectedDevice.id] || {}) }
    : DEFAULT_LIGHT_COLOR_SETTINGS;
  const selectedLightInfoCardSettings = selectedDevice
    ? { ...DEFAULT_LIGHT_INFO_CARD_SETTINGS, ...(lightInfoCardSettingsByItemId[selectedDevice.id] || {}) }
    : DEFAULT_LIGHT_INFO_CARD_SETTINGS;
  const savedPagesByLastUpdate = useMemo(
    () => [...savedPages].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [savedPages]
  );

  useEffect(() => {
    const { pages, error } = readSavedPagesFromStorage();
    setSavedPages(pages);
    setPageStorageError(error);
  }, []);

  const getTemperatureLabel = (temperature: number): string => {
    if (temperature < 2600) return 'Candlelight';
    if (temperature < 3200) return 'Warm White';
    if (temperature < 4300) return 'Soft White';
    if (temperature < 5400) return 'Neutral White';
    return 'Daylight';
  };

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

  const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };
  const clampNumber = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

  const normalizeBrightness = (value: unknown): number | undefined => {
    const numeric = toFiniteNumber(value);
    if (numeric === undefined) return undefined;
    if (numeric <= 1) return Math.max(0, Math.min(100, Math.round(numeric * 100)));
    if (numeric <= 100) return Math.max(0, Math.min(100, Math.round(numeric)));
    return Math.max(0, Math.min(100, Math.round((numeric / 255) * 100)));
  };

  const normalizeTemperature = (value: unknown): number | undefined => {
    const numeric = toFiniteNumber(value);
    if (numeric === undefined) return undefined;
    if (numeric >= 1000) return Math.round(numeric);
    if (numeric >= 100 && numeric <= 1000) return Math.round(1000000 / numeric);
    return undefined;
  };

  const normalizeRgb = (value: unknown): [number, number, number] | undefined => {
    if (Array.isArray(value) && value.length >= 3) {
      return [
        Math.max(0, Math.min(255, Number(value[0]) || 0)),
        Math.max(0, Math.min(255, Number(value[1]) || 0)),
        Math.max(0, Math.min(255, Number(value[2]) || 0)),
      ];
    }
    if (typeof value === 'string' && value.startsWith('#')) {
      return hexToRgb(value);
    }
    return undefined;
  };

  const extractLightState = (entity?: AvailableEntity | null) => {
    const effective = entity?.data?.effective || {};
    const desired = entity?.data?.desired || {};
    const reported = entity?.data?.reported || {};

    const powerValue =
      typeof effective.power === 'boolean'
        ? effective.power
        : typeof reported.power === 'boolean'
          ? reported.power
          : typeof desired.power === 'boolean'
            ? desired.power
            : undefined;

    const brightnessValue = normalizeBrightness(
      effective.brightness ??
        reported.brightness ??
        desired.brightness
    );

    const temperatureValue = normalizeTemperature(
      effective.temperature ??
        reported.temperature ??
        desired.temperature
    );

    const rgbValue = normalizeRgb(
      effective.rgb ??
        reported.rgb ??
        desired.rgb
    );

    return {
      power: powerValue,
      brightness: brightnessValue,
      temperature: temperatureValue,
      rgb: rgbValue,
    };
  };

  const { data: availableEntities = [], isLoading: isEntitiesLoading, error: entitiesError } = useQuery<AvailableEntity[]>({
    queryKey: ['builder-entities-catalog'],
    enabled: !!selectedDevice,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    queryFn: async () => {
      const pluginsResponse = await axios.get('/api/plugins', {
        validateStatus: (status) => status >= 200 && status < 500,
      });
      if (pluginsResponse.status >= 400) return [];

      const rawPlugins = pluginsResponse.data as
        | Record<string, { manifest?: { id?: string }; id?: string }>
        | Array<{ manifest?: { id?: string }; id?: string }>;
      const pluginIds = (Array.isArray(rawPlugins) ? rawPlugins : Object.values(rawPlugins || {}))
        .map((value) => value?.manifest?.id || value?.id)
        .filter((value): value is string => Boolean(value));

      const flattenedEntities: AvailableEntity[] = [];
      for (const pluginId of pluginIds) {
        const devicesResponse = await axios.get(`/api/plugins/${pluginId}/devices`, {
          validateStatus: (status) => status >= 200 && status < 500,
        });
        if (devicesResponse.status >= 400) continue;

        const devices = (
          Array.isArray(devicesResponse.data)
            ? devicesResponse.data
            : Object.values(devicesResponse.data || {})
        ) as Array<{ id: string }>;

        for (const device of devices) {
          const entitiesResponse = await axios.get(`/api/plugins/${pluginId}/devices/${device.id}/entities`, {
            validateStatus: (status) => status >= 200 && status < 500,
          });
          if (entitiesResponse.status >= 400) continue;

          const entities = (
            Array.isArray(entitiesResponse.data)
              ? entitiesResponse.data
              : Object.values(entitiesResponse.data || {})
          ) as AvailableEntity[];

          flattenedEntities.push(
            ...entities.map((entity) => ({
              ...entity,
              plugin_id: pluginId,
              device_id: device.id,
            }))
          );
        }
      }
      return flattenedEntities;
    },
  });

  const filteredEntities = useMemo(() => {
    if (!selectedDevice) return [];
    const query = entitySearch.trim().toLowerCase();
    return availableEntities.filter((entity) => {
      if (!domainMatchesDeviceType(entity.domain, selectedDevice.deviceType)) return false;
      if (!query) return true;
      const label = getEntityLabel(entity).toLowerCase();
      const domain = (entity.domain || '').toLowerCase();
      const id = entity.id.toLowerCase();
      return label.includes(query) || domain.includes(query) || id.includes(query);
    });
  }, [availableEntities, entitySearch, selectedDevice]);
  const entitiesErrorMessage = entitiesError instanceof Error ? entitiesError.message : 'Failed to load entities.';

  const resolveEntityContext = (entity: AvailableEntity, expectedType?: DeviceType): AvailableEntity => {
    if (entity.plugin_id && entity.device_id) return entity;
    const candidate = availableEntities.find((current) => {
      if (current.id !== entity.id) return false;
      if (expectedType && !domainMatchesDeviceType(current.domain, expectedType)) return false;
      return Boolean(current.plugin_id && current.device_id);
    });
    return candidate ? { ...candidate, ...entity, plugin_id: candidate.plugin_id, device_id: candidate.device_id } : entity;
  };

  const getLightColorCommandCandidates = (entity: AvailableEntity): string[] => {
    const actionSet = new Set<string>();
    (entity.actions || []).forEach((action) => actionSet.add(action));
    (entity.schema?.commands || []).forEach((command) => {
      if (command.action) actionSet.add(command.action);
    });

    const supported = ['set_color', 'set_rgb'].filter((action) => actionSet.has(action));
    return supported.length > 0 ? supported : ['set_color', 'set_rgb'];
  };

  const refreshLightStateForItem = async (itemId: string, entity: AvailableEntity) => {
    const contextualEntity = resolveEntityContext(entity, 'light');
    if (!contextualEntity.plugin_id || !contextualEntity.device_id) {
      console.debug('[PageBuilder] refresh skipped: missing plugin/device context', { itemId, entityId: entity.id });
      return;
    }
    try {
      console.debug('[PageBuilder] refreshing light state', {
        itemId,
        pluginId: contextualEntity.plugin_id,
        deviceId: contextualEntity.device_id,
        entityId: contextualEntity.id,
      });
      const response = await axios.get(
        `/api/plugins/${contextualEntity.plugin_id}/devices/${contextualEntity.device_id}/entities`
      );
      const entities = (Array.isArray(response.data) ? response.data : Object.values(response.data || {})) as AvailableEntity[];
      const currentEntity = entities.find((candidate) => candidate.id === contextualEntity.id);
      const parsed = extractLightState(currentEntity || contextualEntity);

      if (typeof parsed.power === 'boolean') {
        setLightPowerByItemId((current) => ({ ...current, [itemId]: parsed.power as boolean }));
      }
      if (typeof parsed.temperature === 'number') {
        setLightTemperatureByItemId((current) => ({ ...current, [itemId]: parsed.temperature as number }));
      }
      if (typeof parsed.brightness === 'number') {
        setLightBrightnessByItemId((current) => ({ ...current, [itemId]: parsed.brightness as number }));
      }
      if (parsed.rgb) {
        setLightRgbByItemId((current) => ({ ...current, [itemId]: parsed.rgb as [number, number, number] }));
      }
      console.debug('[PageBuilder] light state updated', {
        itemId,
        entityId: contextualEntity.id,
        power: parsed.power,
        temperature: parsed.temperature,
        brightness: parsed.brightness,
        rgb: parsed.rgb,
      });
    } catch {
      console.error('[PageBuilder] refresh failed', {
        itemId,
        pluginId: contextualEntity.plugin_id,
        deviceId: contextualEntity.device_id,
        entityId: contextualEntity.id,
      });
    }
  };

  const lightModuleBindings = useMemo(() => {
    return Object.entries(selectedEntitiesByItemId)
      .map(([itemId, entity]) => {
        const item = findItemById(items, itemId);
        const module = selectedModulesByItemId[itemId];
        if (!item || item.type !== 'device') return null;
        if (item.deviceType !== 'light') return null;
        if (!module) return null;
        const contextualEntity = resolveEntityContext(entity, 'light');
        if (!contextualEntity.plugin_id || !contextualEntity.device_id) return null;
        return { itemId, entity: contextualEntity };
      })
      .filter((binding): binding is { itemId: string; entity: AvailableEntity } => Boolean(binding));
  }, [availableEntities, items, selectedEntitiesByItemId, selectedModulesByItemId]);

  useEffect(() => {
    lightModuleBindings.forEach((binding) => {
      void refreshLightStateForItem(binding.itemId, binding.entity);
    });
  }, [lightModuleBindings]);

  useEffect(() => {
    if (lightModuleBindings.length === 0) return;
    const es = new EventSource('/api/topics/subscribe');

    const refreshAllBindings = () => {
      lightModuleBindings.forEach((binding) => {
        void refreshLightStateForItem(binding.itemId, binding.entity);
      });
    };

    const scheduleRefreshAllBindings = () => {
      if (pendingLightRefreshTimer.current !== null) return;
      pendingLightRefreshTimer.current = window.setTimeout(() => {
        pendingLightRefreshTimer.current = null;
        refreshAllBindings();
      }, 250);
    };

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as {
          type?: string;
          plugin_id?: string;
          device_id?: string;
          entity_id?: string;
          entity?: string;
          id?: string;
          pluginId?: string;
          deviceId?: string;
        };
        if (msg.type !== 'entity' && msg.type !== 'device') return;

        const eventPluginId = msg.plugin_id || msg.pluginId;
        const eventDeviceId = msg.device_id || msg.deviceId;
        console.debug('[PageBuilder] topic event received', {
          type: msg.type,
          pluginId: eventPluginId,
          deviceId: eventDeviceId,
          entityId: msg.entity_id || msg.entity || msg.id,
        });
        if (eventPluginId || eventDeviceId) {
          const hasMatch = lightModuleBindings.some(
            (binding) =>
              (!eventPluginId || binding.entity.plugin_id === eventPluginId) &&
              (!eventDeviceId || binding.entity.device_id === eventDeviceId)
          );
          if (!hasMatch) {
            console.debug('[PageBuilder] topic event ignored: no matching light binding');
            return;
          }
        }

        console.debug('[PageBuilder] topic event matched: scheduling light refresh');
        scheduleRefreshAllBindings();
      } catch {
        // Ignore malformed SSE data.
      }
    };

    return () => {
      if (pendingLightRefreshTimer.current !== null) {
        window.clearTimeout(pendingLightRefreshTimer.current);
        pendingLightRefreshTimer.current = null;
      }
      es.close();
    };
  }, [lightModuleBindings]);

  const onToggleLightModule = async (itemId: string, entity: AvailableEntity) => {
    const contextualEntity = resolveEntityContext(entity, 'light');
    if (!contextualEntity.plugin_id || !contextualEntity.device_id) return;
    const currentPower = lightPowerByItemId[itemId] ?? Boolean(contextualEntity.data?.effective?.power);
    const nextPower = !currentPower;
    setLightPowerByItemId((current) => ({ ...current, [itemId]: nextPower }));
    setLightCommandBusyByItemId((current) => ({ ...current, [itemId]: true }));
    try {
      await axios.post(
        `/api/plugins/${contextualEntity.plugin_id}/devices/${contextualEntity.device_id}/entities/${contextualEntity.id}/commands`,
        {
          type: currentPower ? 'turn_off' : 'turn_on',
        }
      );
      await refreshLightStateForItem(itemId, contextualEntity);
    } finally {
      setLightCommandBusyByItemId((current) => ({ ...current, [itemId]: false }));
    }
  };

  const onSetLightTemperatureModule = async (itemId: string, entity: AvailableEntity, temperature: number) => {
    const contextualEntity = resolveEntityContext(entity, 'light');
    if (!contextualEntity.plugin_id || !contextualEntity.device_id) return;
    setLightTemperatureByItemId((current) => ({ ...current, [itemId]: temperature }));
    setLightCommandBusyByItemId((current) => ({ ...current, [itemId]: true }));
    try {
      await axios.post(
        `/api/plugins/${contextualEntity.plugin_id}/devices/${contextualEntity.device_id}/entities/${contextualEntity.id}/commands`,
        {
          type: 'set_temperature',
          temperature,
        }
      );
      await refreshLightStateForItem(itemId, contextualEntity);
    } finally {
      setLightCommandBusyByItemId((current) => ({ ...current, [itemId]: false }));
    }
  };

  const onSetLightBrightnessModule = async (itemId: string, entity: AvailableEntity, brightness: number) => {
    const contextualEntity = resolveEntityContext(entity, 'light');
    if (!contextualEntity.plugin_id || !contextualEntity.device_id) return;
    setLightBrightnessByItemId((current) => ({ ...current, [itemId]: brightness }));
    setLightCommandBusyByItemId((current) => ({ ...current, [itemId]: true }));
    try {
      await axios.post(
        `/api/plugins/${contextualEntity.plugin_id}/devices/${contextualEntity.device_id}/entities/${contextualEntity.id}/commands`,
        {
          type: 'set_brightness',
          brightness,
        }
      );
      await refreshLightStateForItem(itemId, contextualEntity);
    } finally {
      setLightCommandBusyByItemId((current) => ({ ...current, [itemId]: false }));
    }
  };

  const onSetLightColorModule = async (itemId: string, entity: AvailableEntity, rgb: [number, number, number]) => {
    const contextualEntity = resolveEntityContext(entity, 'light');
    if (!contextualEntity.plugin_id || !contextualEntity.device_id) return;
    setLightRgbByItemId((current) => ({ ...current, [itemId]: rgb }));
    setLightCommandBusyByItemId((current) => ({ ...current, [itemId]: true }));
    try {
      let lastError: unknown;
      for (const action of getLightColorCommandCandidates(contextualEntity)) {
        try {
          await axios.post(
            `/api/plugins/${contextualEntity.plugin_id}/devices/${contextualEntity.device_id}/entities/${contextualEntity.id}/commands`,
            {
              type: action,
              rgb,
              color: rgb,
            }
          );
          await refreshLightStateForItem(itemId, contextualEntity);
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) throw lastError;
    } finally {
      setLightCommandBusyByItemId((current) => ({ ...current, [itemId]: false }));
    }
  };

  const extractItemById = (
    current: CanvasItem[],
    targetId: string
  ): { items: CanvasItem[]; extracted: CanvasItem | null } => {
    let extracted: CanvasItem | null = null;
    const nextItems: CanvasItem[] = [];

    for (const item of current) {
      if (item.id === targetId) {
        extracted = item;
        continue;
      }
      if (item.type === 'row') {
        const nested = extractItemById(item.children, targetId);
        if (nested.extracted) extracted = nested.extracted;
        nextItems.push({ ...item, children: nested.items });
        continue;
      }
      nextItems.push(item);
    }

    return { items: nextItems, extracted };
  };

  const insertIntoRow = (
    current: CanvasItem[],
    targetRowId: string,
    newItem: CanvasItem
  ): { items: CanvasItem[]; inserted: boolean } => {
    let inserted = false;
    const nextItems = current.map((item) => {
      if (item.type !== 'row') return item;
      if (item.id === targetRowId) {
        if (newItem.type === 'row' && newItem.direction === item.direction) return item;
        inserted = true;
        return { ...item, children: [...item.children, newItem] };
      }
      const nested = insertIntoRow(item.children, targetRowId, newItem);
      if (nested.inserted) inserted = true;
      return { ...item, children: nested.items };
    });

    return { items: nextItems, inserted };
  };

  const insertAtIndex = (
    current: CanvasItem[],
    parentId: string | null,
    index: number,
    newItem: CanvasItem
  ): { items: CanvasItem[]; inserted: boolean } => {
    if (parentId === null) {
      const boundedIndex = Math.max(0, Math.min(index, current.length));
      return {
        items: [...current.slice(0, boundedIndex), newItem, ...current.slice(boundedIndex)],
        inserted: true,
      };
    }

    let inserted = false;
    const nextItems = current.map((item) => {
      if (item.type !== 'row') return item;
      if (item.id === parentId) {
        if (newItem.type === 'row' && newItem.direction === item.direction) return item;
        const boundedIndex = Math.max(0, Math.min(index, item.children.length));
        inserted = true;
        return {
          ...item,
          children: [...item.children.slice(0, boundedIndex), newItem, ...item.children.slice(boundedIndex)],
        };
      }
      const nested = insertAtIndex(item.children, parentId, index, newItem);
      if (nested.inserted) inserted = true;
      return { ...item, children: nested.items };
    });

    return { items: nextItems, inserted };
  };

  const moveCanvasItemToParentIndex = (
    current: CanvasItem[],
    itemId: string,
    parentId: string | null,
    index: number,
    cycleGuardItemId?: string
  ): CanvasItem[] => {
    const movingItem = findItemById(current, itemId);
    if (!movingItem) return current;

    if (cycleGuardItemId && movingItem.type === 'row' && containsItemId(movingItem, cycleGuardItemId)) {
      return current;
    }

    if (movingItem.type === 'row' && parentId) {
      const parent = findItemById(current, parentId);
      if (parent?.type === 'row' && parent.direction === movingItem.direction) {
        return current;
      }
    }

    const originalLocation = findItemLocation(current, itemId);
    if (!originalLocation) return current;

    const extracted = extractItemById(current, itemId);
    if (!extracted.extracted) return current;

    let insertIndex = index;
    if (originalLocation.parentId === parentId && originalLocation.index < insertIndex) {
      insertIndex -= 1;
    }

    const inserted = insertAtIndex(extracted.items, parentId, insertIndex, extracted.extracted);
    return inserted.inserted ? inserted.items : current;
  };

  const moveCanvasItem = (
    current: CanvasItem[],
    itemId: string,
    target: { kind: 'canvas-end' } | { kind: 'row-end'; rowId: string } | { kind: 'before-item'; targetItemId: string }
  ): CanvasItem[] => {
    if (target.kind === 'before-item') {
      if (target.targetItemId === itemId) return current;
      const targetLocation = findItemLocation(current, target.targetItemId);
      if (!targetLocation) return current;
      return moveCanvasItemToParentIndex(
        current,
        itemId,
        targetLocation.parentId,
        targetLocation.index,
        target.targetItemId
      );
    }

    if (target.kind === 'row-end') {
      const row = findItemById(current, target.rowId);
      if (row?.type !== 'row') return current;
      return moveCanvasItemToParentIndex(current, itemId, target.rowId, row.children.length, target.rowId);
    }

    return moveCanvasItemToParentIndex(current, itemId, null, current.length);
  };

  const onCanvasDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) return;
    const payload = getDragPayload(event);
    if (!payload || payload.source !== 'canvas') return;
    setItems((current) => moveCanvasItem(current, payload.itemId, { kind: 'canvas-end' }));
  };

  const onRowBodyDragEnter = (event: DragEvent<HTMLDivElement>, rowId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = getDragPayload(event);
    if (!payload || payload.source !== 'canvas') return;
    setItems((current) => moveCanvasItem(current, payload.itemId, { kind: 'row-end', rowId }));
  };

  const onItemDragEnter = (event: DragEvent<HTMLDivElement>, targetItemId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = getDragPayload(event);
    if (!payload || payload.source !== 'canvas') return;
    setItems((current) => moveCanvasItem(current, payload.itemId, { kind: 'before-item', targetItemId }));
  };

  const onCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const payload = getDragPayload(event);
    if (!payload) return;

    setItems((current) => {
      if (payload.source === 'palette') {
        const newItem = createItemFromPalette(payload.itemType);
        return newItem ? [...current, newItem] : current;
      }
      return moveCanvasItem(current, payload.itemId, { kind: 'canvas-end' });
    });

    activeDragPayload.current = null;
  };

  const onRowDrop = (event: DragEvent<HTMLDivElement>, rowId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = getDragPayload(event);
    if (!payload) return;

    setItems((current) => {
      if (payload.source === 'palette') {
        const newItem = createItemFromPalette(payload.itemType);
        if (!newItem) return current;
        const inserted = insertIntoRow(current, rowId, newItem);
        return inserted.inserted ? inserted.items : current;
      }
      return moveCanvasItem(current, payload.itemId, { kind: 'row-end', rowId });
    });

    activeDragPayload.current = null;
  };

  const renderObjectHeader = (title: string, icon: ReactNode, itemId: string) => (
    isEditorMode ? (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 10px',
          borderBottom: '1px solid #d1d5db',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#111827' }}>
          {icon}
          <span>{title}</span>
        </div>
        <div
          draggable
          onDragStart={(event) => onItemDragStart(event, itemId)}
          onDragEnd={onDragEnd}
          style={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: '#4b5563' }}
          aria-label={`Drag ${title}`}
        >
          <DragIndicatorIcon fontSize="small" />
        </div>
      </div>
    ) : null
  );

  const renderDevice = (device: DeviceItem) => {
    const baseTitle = getItemTitle(device);
    const assignedEntity = selectedEntitiesByItemId[device.id];
    const assignedLightState = extractLightState(assignedEntity);
    const selectedModuleForDevice = selectedModulesByItemId[device.id];
    const title = assignedEntity ? getEntityLabel(assignedEntity) : baseTitle;
    const isLightOn = lightPowerByItemId[device.id] ?? assignedLightState.power ?? false;
    const lightTemperature = lightTemperatureByItemId[device.id] ?? assignedLightState.temperature ?? 4000;
    const lightBrightness = lightBrightnessByItemId[device.id] ?? assignedLightState.brightness ?? 50;
    const lightRgb = lightRgbByItemId[device.id] ?? assignedLightState.rgb ?? [255, 255, 255];
    const lightTemperatureValue = lightTemperatureByItemId[device.id] ?? assignedLightState.temperature;
    const lightBrightnessValue = lightBrightnessByItemId[device.id] ?? assignedLightState.brightness;
    const lightRgbValue = lightRgbByItemId[device.id] ?? assignedLightState.rgb;
    const lightHexValue = lightRgbValue ? rgbToHex(lightRgbValue) : null;
    const iconSettings = { ...DEFAULT_LIGHT_ICON_ONLY_SETTINGS, ...(lightIconOnlySettingsByItemId[device.id] || {}) };
    const temperatureSettings = { ...DEFAULT_LIGHT_TEMPERATURE_SETTINGS, ...(lightTemperatureSettingsByItemId[device.id] || {}) };
    const brightnessSettings = { ...DEFAULT_LIGHT_BRIGHTNESS_SETTINGS, ...(lightBrightnessSettingsByItemId[device.id] || {}) };
    const colorSliderSettings = { ...DEFAULT_LIGHT_COLOR_SLIDER_SETTINGS, ...(lightColorSliderSettingsByItemId[device.id] || {}) };
    const colorSettings = { ...DEFAULT_LIGHT_COLOR_SETTINGS, ...(lightColorSettingsByItemId[device.id] || {}) };
    const infoCardSettings = { ...DEFAULT_LIGHT_INFO_CARD_SETTINGS, ...(lightInfoCardSettingsByItemId[device.id] || {}) };
    const moduleMinWidth = getLightModuleMinWidth(
      selectedModuleForDevice,
      iconSettings,
      temperatureSettings,
      brightnessSettings,
      colorSliderSettings,
      colorSettings,
      infoCardSettings,
      clampNumber
    );
    const iconByType: Record<DeviceType, ReactNode> = {
      light: <LightbulbOutlinedIcon fontSize="small" />,
      switch: <ToggleOnOutlinedIcon fontSize="small" />,
      sensor: <span style={{ fontSize: 12, fontWeight: 700 }}>S</span>,
      camera: <span style={{ fontSize: 12, fontWeight: 700 }}>C</span>,
      cover: <span style={{ fontSize: 12, fontWeight: 700 }}>CV</span>,
    };
    const icon = iconByType[device.deviceType];
    const isSelected = selectedItemId === device.id;
    const moduleHeading = assignedEntity ? getEntityLabel(assignedEntity) : baseTitle;

    return (
      <div
        key={device.id}
        onClick={
          isEditorMode
            ? (event) => {
                event.stopPropagation();
                selectItem(device.id);
              }
            : undefined
        }
        onDragOver={isEditorMode ? onDragOver : undefined}
        onDragEnter={isEditorMode ? (event) => onItemDragEnter(event, device.id) : undefined}
        style={{
          border: isEditorMode ? `2px solid ${isSelected ? '#ff3300' : '#9ca3af'}` : '1px solid #e2e8f0',
          borderRadius: 10,
          overflow: 'hidden',
          minWidth: device.deviceType === 'light' && selectedModuleForDevice ? Math.max(150, moduleMinWidth + 16) : 150,
          background: '#f8fafc',
          cursor: isEditorMode ? 'pointer' : 'default',
        }}
      >
        {renderObjectHeader(title, icon, device.id)}
        <div style={{ padding: 10, color: '#334155', fontSize: 13, display: 'flex', justifyContent: 'center' }}>
          {device.deviceType === 'light' ? (
            <LightModuleCardContent
              baseTitle={baseTitle}
              moduleHeading={moduleHeading}
              assignedEntity={assignedEntity}
              selectedModuleForDevice={selectedModuleForDevice}
              lightCommandBusy={lightCommandBusyByItemId[device.id]}
              isLightOn={isLightOn}
              lightTemperature={lightTemperature}
              lightBrightness={lightBrightness}
              lightRgb={lightRgb}
              lightTemperatureValue={lightTemperatureValue}
              lightBrightnessValue={lightBrightnessValue}
              lightHexValue={lightHexValue}
              iconSettings={iconSettings}
              temperatureSettings={temperatureSettings}
              brightnessSettings={brightnessSettings}
              colorSliderSettings={colorSliderSettings}
              colorSettings={colorSettings}
              infoCardSettings={infoCardSettings}
              getTemperatureLabel={getTemperatureLabel}
              clampNumber={clampNumber}
              hexToRgb={hexToRgb}
              rgbToHex={rgbToHex}
              onToggleLight={() => {
                if (!assignedEntity) return;
                void onToggleLightModule(device.id, assignedEntity);
              }}
              onTemperatureInput={(value) => {
                setLightTemperatureByItemId((current) => ({ ...current, [device.id]: value }));
              }}
              onTemperatureCommit={(value) => {
                if (!assignedEntity) return;
                void onSetLightTemperatureModule(device.id, assignedEntity, value);
              }}
              onBrightnessInput={(value) => {
                setLightBrightnessByItemId((current) => ({ ...current, [device.id]: value }));
              }}
              onBrightnessCommit={(value) => {
                if (!assignedEntity) return;
                void onSetLightBrightnessModule(device.id, assignedEntity, value);
              }}
              onRgbInput={(value) => {
                setLightRgbByItemId((current) => ({ ...current, [device.id]: value }));
              }}
              onColorCommit={(value) => {
                if (!assignedEntity) return;
                void onSetLightColorModule(device.id, assignedEntity, value);
              }}
            />
          ) : (
            <GenericEntityModuleCard title={baseTitle} deviceType={device.deviceType} />
          )}
        </div>
      </div>
    );
  };

  const renderCanvasItem = (item: CanvasItem) =>
    item.type === 'row' ? (
      <div
        key={item.id}
        onClick={
          isEditorMode
            ? (event) => {
                event.stopPropagation();
                selectItem(item.id);
              }
            : undefined
        }
        onDragOver={isEditorMode ? onDragOver : undefined}
        onDragEnter={isEditorMode ? (event) => onItemDragEnter(event, item.id) : undefined}
        onDrop={isEditorMode ? (event) => onRowDrop(event, item.id) : undefined}
        style={{
          border: isEditorMode ? `2px solid ${selectedItemId === item.id ? '#ff3300' : '#9ca3af'}` : 'none',
          borderRadius: 10,
          overflow: 'hidden',
          background: isEditorMode ? '#f8fafc' : 'transparent',
          cursor: isEditorMode ? 'pointer' : 'default',
        }}
      >
        {renderObjectHeader(
          getItemTitle(item),
          item.direction === 'horizontal' ? <ViewWeekOutlinedIcon fontSize="small" /> : <ViewStreamOutlinedIcon fontSize="small" />,
          item.id
        )}
        <div
          onDragOver={isEditorMode ? onDragOver : undefined}
          onDragEnter={isEditorMode ? (event) => onRowBodyDragEnter(event, item.id) : undefined}
          onDrop={isEditorMode ? (event) => onRowDrop(event, item.id) : undefined}
          style={{
            display: 'flex',
            flexDirection: item.direction === 'horizontal' ? 'row' : 'column',
            gap: 8,
            minHeight: isEditorMode ? 72 : 0,
            padding: isEditorMode ? 10 : 0,
            border: isEditorMode ? '1px dashed #d1d5db' : 'none',
            margin: isEditorMode ? 10 : 0,
            borderRadius: 8,
            background: isEditorMode ? '#f3f4f6' : 'transparent',
          }}
        >
          {isEditorMode && item.children.length === 0 && (
              <div style={{ color: '#6b7280', fontSize: 13 }}>
              Drop a device or a {item.direction === 'horizontal' ? 'vertical' : 'horizontal'} row.
              </div>
            )}
            {item.children.map((child) => renderCanvasItem(child))}
        </div>
      </div>
    ) : (
      renderDevice(item)
    );

  return (
    <PageBuilderThemeProvider>
    <div style={{ minHeight: '100vh', padding: 16, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ margin: 0 }}>Page Builder</h2>
          <Link to="/page-builder/modules/light/light-temperature-slider" style={{ fontSize: 13 }}>
            Open light module workbench
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              style={{
                border: '1px solid #94a3b8',
                background: isEditorMode ? '#e2e8f0' : '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Editor mode
            </button>
            <button
              type="button"
              onClick={() => setViewMode('runtime')}
              style={{
                border: '1px solid #94a3b8',
                background: !isEditorMode ? '#e2e8f0' : '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Runtime mode
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <input
              value={pageName}
              onChange={(event) => setPageName(event.target.value)}
              placeholder="Page name"
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 13,
                minWidth: 180,
              }}
            />
            <button
              type="button"
              onClick={() => savePage(false)}
              style={{
                border: '1px solid #94a3b8',
                background: '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Save page
            </button>
            <button
              type="button"
              onClick={() => savePage(true)}
              style={{
                border: '1px solid #94a3b8',
                background: '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Save as new
            </button>
            <button
              type="button"
              onClick={createNewPage}
              style={{
                border: '1px solid #94a3b8',
                background: '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              New page
            </button>
            <select
              value={selectedSavedPageId}
              onChange={(event) => setSelectedSavedPageId(event.target.value)}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 13,
                minWidth: 200,
                background: '#fff',
              }}
            >
              <option value="">Select saved page</option>
              {savedPagesByLastUpdate.map((savedPage) => (
                <option key={savedPage.id} value={savedPage.id}>
                  {savedPage.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedSavedPageId}
              onClick={() => loadSelectedPage(false)}
              style={{
                border: '1px solid #94a3b8',
                background: '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: selectedSavedPageId ? 'pointer' : 'not-allowed',
                opacity: selectedSavedPageId ? 1 : 0.6,
              }}
            >
              Load
            </button>
            <button
              type="button"
              disabled={!selectedSavedPageId}
              onClick={() => loadSelectedPage(true)}
              style={{
                border: '1px solid #94a3b8',
                background: '#fff',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: selectedSavedPageId ? 'pointer' : 'not-allowed',
                opacity: selectedSavedPageId ? 1 : 0.6,
              }}
            >
              Load + render
            </button>
          </div>
          {activePageId && <div style={{ fontSize: 12, color: '#475569' }}>Active page id: {activePageId}</div>}
          {pageStorageError && <div style={{ fontSize: 12, color: '#b91c1c' }}>{pageStorageError}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
      {isEditorMode && (
      <aside
        style={{
          width: 220,
          border: '1px solid #d1d5db',
          borderRadius: 10,
          padding: 12,
          background: '#f9fafb',
          height: 'fit-content',
        }}
      >
        <h3 style={{ margin: '0 0 12px' }}>Toolbox</h3>
        {[
          { label: 'Horizontal row', type: 'row-horizontal' as const },
          { label: 'Vertical row', type: 'row-vertical' as const },
          { label: 'Light device', type: 'device-light' as const },
          { label: 'Switch device', type: 'device-switch' as const },
          { label: 'Sensor device', type: 'device-sensor' as const },
          { label: 'Camera device', type: 'device-camera' as const },
          { label: 'Cover device', type: 'device-cover' as const },
        ].map((tool) => (
          <div
            key={tool.type}
            draggable
            onDragStart={(event) => onPaletteDragStart(event, tool.type)}
            onDragEnd={onDragEnd}
            style={{
              border: '1px solid #9ca3af',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 8,
              cursor: 'grab',
              background: '#ffffff',
            }}
          >
            {tool.label}
          </div>
        ))}
      </aside>
      )}

      <main style={{ flex: 1 }}>
        <div
          onClick={isEditorMode ? () => setSelectedItemId(null) : undefined}
          onDragOver={isEditorMode ? onDragOver : undefined}
          onDragEnter={isEditorMode ? onCanvasDragEnter : undefined}
          onDrop={isEditorMode ? onCanvasDrop : undefined}
          style={{
            border: isEditorMode ? '2px dashed #9ca3af' : 'none',
            borderRadius: 12,
            padding: isEditorMode ? 16 : 0,
            minHeight: 500,
            background: isEditorMode ? '#f3f4f6' : 'transparent',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {isEditorMode && items.length === 0 && <div>Drag components here to start building.</div>}
          {items.map((item) => renderCanvasItem(item))}
        </div>
      </main>
      {isEditorMode && (
      <aside
        style={{
          width: 320,
          border: '1px solid #d1d5db',
          borderRadius: 10,
          padding: 12,
          background: '#ffffff',
          height: 'fit-content',
        }}
      >
        <h3 style={{ margin: '0 0 12px' }}>Details</h3>
        {!selectedItem && <div style={{ color: '#6b7280' }}>Select an object to view details.</div>}
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 700 }}>
              {selectedItem.type === 'device' && selectedEntity ? getEntityLabel(selectedEntity) : getItemTitle(selectedItem)}
            </div>
            {selectedItem.type === 'row' ? (
              <div style={{ color: '#6b7280', fontSize: 14 }}>Row selected. Entity binding is for device objects.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setDetailsTab('binding')}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      padding: '6px 10px',
                      background: detailsTab === 'binding' ? '#e2e8f0' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Binding
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsTab('module')}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      padding: '6px 10px',
                      background: detailsTab === 'module' ? '#e2e8f0' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Module
                  </button>
                </div>
                {detailsTab === 'binding' && (
                  <>
                    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Entity</div>
                    {selectedEntity && !showEntityPicker ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>{getEntityLabel(selectedEntity)}</span>
                        <button
                          type="button"
                          onClick={() => setShowEntityPicker(true)}
                          style={{
                            border: 0,
                            background: 'transparent',
                            color: '#2563eb',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          change
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          value={entitySearch}
                          onChange={(event) => setEntitySearch(event.target.value)}
                          placeholder={`Search ${selectedItem.deviceType} entities`}
                          style={{
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            padding: '8px 10px',
                            fontSize: 14,
                          }}
                        />
                        {isEntitiesLoading && <div style={{ color: '#6b7280' }}>Loading entities...</div>}
                        {entitiesError && <div style={{ color: '#b91c1c' }}>{entitiesErrorMessage}</div>}
                        {!isEntitiesLoading && !entitiesError && (
                          <div
                            style={{
                              maxHeight: 360,
                              overflowY: 'auto',
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                            }}
                          >
                            {filteredEntities.length === 0 && (
                              <div style={{ padding: 10, color: '#6b7280' }}>No matching entities.</div>
                            )}
                            {filteredEntities.map((entity) => (
                              <button
                                key={entity.id}
                                type="button"
                                onClick={() => {
                                  setSelectedEntitiesByItemId((current) => ({ ...current, [selectedItem.id]: entity }));
                                  setShowEntityPicker(false);
                                  void refreshLightStateForItem(selectedItem.id, entity);
                                }}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  border: 0,
                                  borderBottom: '1px solid #f1f5f9',
                                  background: '#fff',
                                  padding: '8px 10px',
                                  cursor: 'pointer',
                                }}
                              >
                                <div style={{ fontSize: 14 }}>{getEntityLabel(entity)}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{entity.domain || 'unknown-domain'}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                {detailsTab === 'module' && (
                  <>
                    {!selectedEntity ? (
                      <div style={{ color: '#6b7280', fontSize: 14 }}>Select an entity first in Binding.</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Module</div>
                        {getAvailableModulesForDeviceType(selectedItem.deviceType).length === 0 ? (
                          <div style={{ color: '#6b7280', fontSize: 14 }}>No modules available for this entity type yet.</div>
                        ) : (
                          <select
                            value={selectedModule || ''}
                            onChange={(event) => {
                              const value = event.target.value as BuilderModuleType | '';
                              setSelectedModulesByItemId((current) => ({
                                ...current,
                                [selectedItem.id]: value || undefined,
                              }));
                              if (value === 'light-icon-only') {
                                setLightIconOnlySettingsByItemId((current) => ({
                                  ...current,
                                  [selectedItem.id]: current[selectedItem.id] || { ...DEFAULT_LIGHT_ICON_ONLY_SETTINGS },
                                }));
                              }
                              if (value === 'light-temperature-slider') {
                                setLightTemperatureSettingsByItemId((current) => ({
                                  ...current,
                                  [selectedItem.id]: current[selectedItem.id] || { ...DEFAULT_LIGHT_TEMPERATURE_SETTINGS },
                                }));
                              }
                              if (value === 'light-brightness-slider') {
                                setLightBrightnessSettingsByItemId((current) => ({
                                  ...current,
                                  [selectedItem.id]: current[selectedItem.id] || { ...DEFAULT_LIGHT_BRIGHTNESS_SETTINGS },
                                }));
                              }
                              if (value === 'light-color-slider') {
                                setLightColorSliderSettingsByItemId((current) => ({
                                  ...current,
                                  [selectedItem.id]: current[selectedItem.id] || { ...DEFAULT_LIGHT_COLOR_SLIDER_SETTINGS },
                                }));
                              }
                              if (value === 'light-color-wheel') {
                                setLightColorSettingsByItemId((current) => ({
                                  ...current,
                                  [selectedItem.id]: current[selectedItem.id] || { ...DEFAULT_LIGHT_COLOR_SETTINGS },
                                }));
                              }
                              if (value === 'light-info-card') {
                                setLightInfoCardSettingsByItemId((current) => ({
                                  ...current,
                                  [selectedItem.id]: current[selectedItem.id] || { ...DEFAULT_LIGHT_INFO_CARD_SETTINGS },
                                }));
                              }
                              setDetailsTab('module');
                            }}
                            style={{
                              border: '1px solid #d1d5db',
                              borderRadius: 8,
                              padding: '8px 10px',
                              fontSize: 14,
                              background: '#fff',
                            }}
                          >
                            <option value="">Select module</option>
                            {getAvailableModulesForDeviceType(selectedItem.deviceType).map((moduleOption) => (
                              <option key={moduleOption.value} value={moduleOption.value}>
                                {moduleOption.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {selectedModule && (
                          <>
                            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Settings</div>
                            {selectedItem.deviceType === 'light' && (
                              <LightModuleSettingsPanel
                                itemId={selectedItem.id}
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
                            )}
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </aside>
      )}
      </div>
    </div>
    </PageBuilderThemeProvider>
  );
}

export default PageBuilder;
