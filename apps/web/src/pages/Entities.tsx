import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Typography, Box, Card, CardContent, Grid,
  CircularProgress, Breadcrumbs, Chip, Button, Slider, LinearProgress, Tooltip, IconButton,
} from '@mui/material';
import {
  Zap, ToggleLeft, Radio, Cpu, Calendar, Clock, Camera, DoorOpen, Settings, Activity,
} from 'lucide-react';
import { LabelEditor } from '../components/LabelEditor';
import { EntityTraceDrawer } from '../components/EntityTraceDrawer';

interface EntityData {
  effective?: {
    power?: boolean;
    brightness?: number;
    rgb?: number[];
    temperature?: number;
    percent?: number;
    value?: string;
    online?: boolean;
    stream_url?: string;
    detecting?: boolean;
    recording?: boolean;
    fps?: number;
  };
  sync_status?: string;
  updated_at?: string;
}

interface Entity {
  id: string;
  device_id: string;
  domain: string;
  local_name: string;
  actions?: string[];
  data?: EntityData;
  schema?: {
    commands?: Array<{ action: string; fields?: any[] }>;
  };
  labels?: Record<string, string[]>;
}

interface EntityRate {
  plugin_id: string;
  device_id: string;
  entity_id: string;
  event_count: number;
  command_count: number;
  window_seconds: number;
  events_per_sec: number;
  commands_per_sec: number;
  total_per_sec: number;
}

function domainIcon(domain: string) {
  if (domain === 'light')       return <Zap className="w-5 h-5 text-yellow-500" />;
  if (domain === 'switch')      return <ToggleLeft className="w-5 h-5 text-blue-500" />;
  if (domain === 'binary_sensor') return <Radio className="w-5 h-5 text-purple-500" />;
  if (domain === 'sensor.cpu')  return <Cpu className="w-5 h-5 text-orange-500" />;
  if (domain === 'sensor.date') return <Calendar className="w-5 h-5 text-green-500" />;
  if (domain === 'sensor.time') return <Clock className="w-5 h-5 text-green-500" />;
  if (domain === 'camera')      return <Camera className="w-5 h-5 text-red-500" />;
  if (domain === 'cover')       return <DoorOpen className="w-5 h-5 text-teal-500" />;
  return <Settings className="w-5 h-5 text-gray-400" />;
}

function rgbToCss(rgb: number[] | undefined) {
  if (!rgb || rgb.length < 3) return undefined;
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

// ── Light ──────────────────────────────────────────────────────────────────────
function LightControls({
  entity,
  onCommand,
  error,
}: {
  entity: Entity;
  onCommand: (action: string, fields?: Record<string, any>) => Promise<void>;
  error?: string;
}) {
  const effective = entity.data?.effective;
  const power = effective?.power;
  const [brightness, setBrightness] = useState<number>(effective?.brightness ?? 50);
  const [temperature, setTemperature] = useState<number>(effective?.temperature ?? 4000);
  const color = rgbToCss(effective?.rgb);

  return (
    <Box display="flex" flexDirection="column" gap={1.5} minWidth={260}>
      <Box display="flex" alignItems="center" gap={1}>
        <Chip label={power ? 'ON' : 'OFF'} color={power ? 'success' : 'default'} size="small" />
        {color && (
          <Tooltip title={`RGB: ${effective?.rgb?.join(', ')}`}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: color, border: '1px solid #ccc' }} />
          </Tooltip>
        )}
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </Box>

      <Button
        size="small"
        variant="contained"
        color={power ? 'error' : 'success'}
        sx={{ alignSelf: 'flex-start' }}
        onClick={() => onCommand(power ? 'turn_off' : 'turn_on')}
      >
        {power ? 'Turn Off' : 'Turn On'}
      </Button>

      {entity.actions?.includes('set_brightness') && (
        <Box>
          <Typography variant="caption" color="textSecondary">Brightness: {brightness}%</Typography>
          <Slider
            value={brightness}
            min={0} max={100}
            size="small"
            valueLabelDisplay="auto"
            onChange={(_, v) => setBrightness(v as number)}
            onChangeCommitted={(_, v) => onCommand('set_brightness', { brightness: v as number })}
            sx={{ width: 200 }}
          />
        </Box>
      )}

      {entity.actions?.includes('set_temperature') && (
        <Box>
          <Typography variant="caption" color="textSecondary">Color Temp: {temperature}K</Typography>
          <Slider
            value={temperature}
            min={2000} max={6500}
            size="small"
            valueLabelDisplay="auto"
            onChange={(_, v) => setTemperature(v as number)}
            onChangeCommitted={(_, v) => onCommand('set_temperature', { temperature: v as number })}
            sx={{ width: 200 }}
          />
        </Box>
      )}
    </Box>
  );
}

// ── Switch ─────────────────────────────────────────────────────────────────────
function SwitchControls({
  entity,
  onCommand,
  error,
}: {
  entity: Entity;
  onCommand: (action: string) => Promise<void>;
  error?: string;
}) {
  const power = entity.data?.effective?.power;

  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Chip label={power ? 'ON' : 'OFF'} color={power ? 'success' : 'default'} size="small" />
      <Button
        size="small"
        variant="contained"
        color={power ? 'error' : 'success'}
        onClick={() => onCommand(power ? 'turn_off' : 'turn_on')}
      >
        {power ? 'Turn Off' : 'Turn On'}
      </Button>
      {error && <Typography variant="caption" color="error">{error}</Typography>}
    </Box>
  );
}

// ── Binary Sensor ──────────────────────────────────────────────────────────────
function BinarySensorDisplay({ entity }: { entity: Entity }) {
  const power = entity.data?.effective?.power;
  if (power === undefined) return <Chip label="No data" size="small" />;
  return <Chip label={power ? 'ON' : 'OFF'} color={power ? 'warning' : 'default'} size="small" />;
}

// ── Generic Sensor ─────────────────────────────────────────────────────────────
function SensorDisplay({ entity }: { entity: Entity }) {
  const effective = entity.data?.effective as any;

  if (entity.domain === 'sensor.cpu') {
    const pct = effective?.percent ?? 0;
    return (
      <Box minWidth={160}>
        <Typography variant="body2">{pct.toFixed(1)}%</Typography>
        <LinearProgress variant="determinate" value={pct} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
      </Box>
    );
  }

  if (entity.domain === 'sensor.date' || entity.domain === 'sensor.time') {
    return <Typography variant="body2">{effective?.value ?? '—'}</Typography>;
  }

  return <Chip label="Read-only" size="small" variant="outlined" />;
}

// ── Camera ─────────────────────────────────────────────────────────────────────
function CameraDisplay({ entity }: { entity: Entity }) {
  const e = entity.data?.effective;
  return (
    <Box display="flex" flexWrap="wrap" gap={0.75} alignItems="center">
      <Chip label={e?.online ? 'Online' : 'Offline'} color={e?.online ? 'success' : 'error'} size="small" />
      {e?.detecting && <Chip label="Detecting" color="warning" size="small" />}
      {e?.recording && <Chip label="Recording" color="error" size="small" />}
      {e?.fps !== undefined && <Chip label={`${e.fps} fps`} size="small" variant="outlined" />}
      {e?.stream_url && (
        <Tooltip title={e.stream_url}>
          <Chip label="RTSP" size="small" variant="outlined" />
        </Tooltip>
      )}
    </Box>
  );
}

// ── Cover ──────────────────────────────────────────────────────────────────────
function CoverDisplay({ entity }: { entity: Entity }) {
  const status = entity.data?.sync_status;
  return <Chip label={status ?? 'Unknown'} size="small" variant="outlined" />;
}

// ── Entity Card ────────────────────────────────────────────────────────────────
function EntityCard({
  entity,
  pluginId,
  deviceId,
  rate,
  onLabelsUpdate,
  onTrace,
}: {
  entity: Entity;
  pluginId: string;
  deviceId: string;
  rate?: EntityRate;
  onLabelsUpdate?: () => void;
  onTrace?: () => void;
}) {
  const [error, setError] = useState<string | undefined>();

  if (entity.domain === 'config') return null;

  const sendCommand = async (action: string, fields?: Record<string, any>) => {
    try {
      setError(undefined);
      await axios.post(
        `/api/plugins/${pluginId}/devices/${deviceId}/entities/${entity.id}/commands`,
        { type: action, ...fields }
      );
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.details || 'Command failed');
    }
  };

  function renderControls() {
    if (entity.domain === 'light')
      return <LightControls entity={entity} onCommand={sendCommand} error={error} />;
    if (entity.domain === 'switch')
      return <SwitchControls entity={entity} onCommand={sendCommand} error={error} />;
    if (entity.domain === 'binary_sensor')
      return <BinarySensorDisplay entity={entity} />;
    if (entity.domain.startsWith('sensor'))
      return <SensorDisplay entity={entity} />;
    if (entity.domain === 'camera')
      return <CameraDisplay entity={entity} />;
    if (entity.domain === 'cover')
      return <CoverDisplay entity={entity} />;
    return <Chip label={entity.domain} size="small" variant="outlined" />;
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box display="flex" alignItems="flex-start" gap={1.5} flexGrow={1}>
          {domainIcon(entity.domain)}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">{entity.local_name || entity.id}</Typography>
            <Typography variant="caption" color="textSecondary">{entity.domain}</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
              Events/s: {(rate?.events_per_sec || 0).toFixed(2)} | Commands/s: {(rate?.commands_per_sec || 0).toFixed(2)} | Total/s: {(rate?.total_per_sec || 0).toFixed(2)}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                Labels
              </Typography>
              <LabelEditor
                labels={entity.labels}
                onSave={async (labels) => {
                  await axios.put(`/api/plugins/${pluginId}/devices/${deviceId}/entities`, {
                    id: entity.id,
                    device_id: entity.device_id,
                    domain: entity.domain,
                    local_name: entity.local_name || entity.id,
                    labels,
                  });
                  onLabelsUpdate?.();
                }}
              />
            </Box>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {renderControls()}
          <Tooltip title="Trace events & commands">
            <IconButton size="small" onClick={onTrace} sx={{ ml: 1 }}>
              <Activity size={16} />
            </IconButton>
          </Tooltip>
          <Button
            component={Link}
            to={`/plugins/${pluginId}/devices/${deviceId}/entities/${entity.id}/script`}
            variant="outlined"
            size="small"
          >
            Manage Script
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
const Entities: React.FC = () => {
  const { pluginId, deviceId } = useParams<{ pluginId: string; deviceId: string }>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [traceEntity, setTraceEntity] = useState<{ id: string; name: string } | null>(null);

  const { data: entities, isLoading, error, refetch } = useQuery<Entity[]>({
    queryKey: ['entities', deviceId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/plugins/${pluginId}/devices/${deviceId}/entities`);
        const data = Array.isArray(response.data) ? response.data : Object.values(response.data) as Entity[];
        return data.sort((a, b) => {
          const nameA = a.local_name || a.id;
          const nameB = b.local_name || b.id;
          return nameA.localeCompare(nameB);
        });
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 404 || err.response?.status === 500) {
          return [];
        }
        throw err;
      }
    },
    retry: false,
  });
  const { data: rates } = useQuery<EntityRate[]>({
    queryKey: ['entity-rates', pluginId, deviceId],
    queryFn: async () => {
      const response = await axios.get<EntityRate[]>(
        `/api/history/entity-rates?plugin_id=${pluginId}&device_id=${deviceId}&window=30`
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!pluginId && !!deviceId,
    refetchInterval: 2000,
  });

  const rateByEntity = new Map((rates || []).map((r) => [r.entity_id, r]));

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Typography color="error">Error loading entities</Typography>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/plugins" className="text-blue-600 hover:underline">Plugins</Link>
        <Link to={`/plugins/${pluginId}/devices`} className="text-blue-600 hover:underline">{pluginId}</Link>
        <Typography color="textPrimary">{deviceId}</Typography>
        <Typography color="textPrimary">Entities</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>Entities for {deviceId}</Typography>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          variant="contained"
          size="small"
          disabled={!pluginId || !deviceId || refreshing}
          onClick={async () => {
            if (!pluginId || !deviceId) return;
            try {
              setRefreshing(true);
              setRefreshError(null);
              await axios.post(`/api/plugins/${pluginId}/devices/${deviceId}/refresh`);
              await queryClient.invalidateQueries({ queryKey: ['entities', deviceId] });
              await queryClient.invalidateQueries({ queryKey: ['entity-rates', pluginId, deviceId] });
            } catch (err: any) {
              setRefreshError(err?.response?.data?.error || 'Refresh failed');
            } finally {
              setRefreshing(false);
            }
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Entities'}
        </Button>
        {refreshError && (
          <Typography variant="body2" color="error">
            {refreshError}
          </Typography>
        )}
      </Box>

      <Grid container spacing={2}>
        {entities?.filter(e => e.domain !== 'config').map((entity) => (
          <Grid item xs={12} key={entity.id}>
            <EntityCard
              entity={entity}
              pluginId={pluginId!}
              deviceId={deviceId!}
              rate={rateByEntity.get(entity.id)}
              onLabelsUpdate={() => refetch()}
              onTrace={() => setTraceEntity({ id: entity.id, name: entity.local_name || entity.id })}
            />
          </Grid>
        ))}
        {entities?.filter(e => e.domain !== 'config').length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" align="center" sx={{ mt: 4, color: 'text.secondary' }}>
              No entities found for this device.
            </Typography>
          </Grid>
        )}
      </Grid>

      <EntityTraceDrawer
        open={!!traceEntity}
        onClose={() => setTraceEntity(null)}
        pluginId={pluginId!}
        deviceId={deviceId!}
        entityId={traceEntity?.id ?? ''}
        entityName={traceEntity?.name ?? ''}
      />
    </Box>
  );
};

export default Entities;
