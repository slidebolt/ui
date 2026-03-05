import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

interface JournalEvent {
  event_id: string;
  name: string;
  plugin_id: string;
  device_id: string;
  entity_id: string;
  created_at: string;
}

interface StreamLogMessage {
  type: string;
  kind?: 'event' | 'command';
  plugin_id?: string;
  device_id?: string;
  entity_id?: string;
  name?: string;
  state?: string;
  event_id?: string;
  command_id?: string;
  created_at?: string;
  seq?: number;
}

interface PluginResponse {
  [key: string]: {
    manifest: {
      id: string;
      name: string;
      version: string;
      description?: string;
    };
  };
}

interface LogRow {
  id: string;
  kind: 'event' | 'command';
  name: string;
  plugin_id: string;
  device_id: string;
  entity_id: string;
  event_id?: string;
  command_id?: string;
  state?: string;
  created_at: string;
}

const Logs: React.FC = () => {
  const [pluginId, setPluginId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [entityId, setEntityId] = useState('');
  const [search, setSearch] = useState('');
  const [live, setLive] = useState(true);
  const [selectedLogID, setSelectedLogID] = useState<string | null>(null);
  const [rows, setRows] = useState<LogRow[]>([]);

  const { data: plugins } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['plugins-basic'],
    queryFn: async () => {
      const response = await axios.get<PluginResponse>('/api/plugins');
      const data = response.data;
      return Object.entries(data)
        .map(([key, value]) => ({ id: value.manifest.id || key, name: value.manifest.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const { data: snapshot, isLoading, error } = useQuery<JournalEvent[]>({
    queryKey: ['logs-events-snapshot'],
    queryFn: async () => {
      const response = await axios.get('/api/journal/events?limit=100');
      return Array.isArray(response.data) ? response.data : [];
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!snapshot) return;
    setRows(snapshot.map((event) => ({
      id: `event:${event.event_id}:${event.created_at}`,
      kind: 'event',
      name: event.name,
      plugin_id: event.plugin_id,
      device_id: event.device_id,
      entity_id: event.entity_id,
      event_id: event.event_id,
      created_at: event.created_at,
    })));
  }, [snapshot]);

  useEffect(() => {
    if (!live) return;
    const es = new EventSource('/api/topics/subscribe');
    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as StreamLogMessage;
        if (msg.type !== 'log') return;
        if (!msg.plugin_id || !msg.device_id || !msg.entity_id || !msg.created_at) return;
        const kind = msg.kind === 'command' ? 'command' : 'event';
        const id = kind === 'event'
          ? `event:${msg.event_id || ''}:${msg.created_at}:${msg.seq || ''}`
          : `command:${msg.command_id || ''}:${msg.created_at}:${msg.seq || ''}`;
        const row: LogRow = {
          id,
          kind,
          name: kind === 'event' ? (msg.name || 'event') : 'command',
          plugin_id: msg.plugin_id,
          device_id: msg.device_id,
          entity_id: msg.entity_id,
          event_id: msg.event_id,
          command_id: msg.command_id,
          state: msg.state,
          created_at: msg.created_at,
        };
        setRows((prev) => {
          if (prev.some((p) => p.id === row.id)) return prev;
          const next = [row, ...prev];
          if (next.length > 500) return next.slice(0, 500);
          return next;
        });
      } catch {}
    };
    return () => es.close();
  }, [live]);

  const filtered = useMemo(() => {
    const source = rows;
    const term = search.trim().toLowerCase();
    return source.filter((e) => {
      if (pluginId && e.plugin_id !== pluginId) return false;
      if (deviceId && e.device_id !== deviceId) return false;
      if (entityId && e.entity_id !== entityId) return false;
      if (!term) return true;
      return (
        e.name.toLowerCase().includes(term) ||
        e.plugin_id.toLowerCase().includes(term) ||
        e.device_id.toLowerCase().includes(term) ||
        e.entity_id.toLowerCase().includes(term) ||
        (e.event_id || '').toLowerCase().includes(term) ||
        (e.command_id || '').toLowerCase().includes(term) ||
        (e.state || '').toLowerCase().includes(term)
      );
    });
  }, [rows, pluginId, deviceId, entityId, search]);

  const selectedLog = useMemo(
    () => filtered.find((e) => e.id === selectedLogID) || filtered[0] || null,
    [filtered, selectedLogID]
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Typography color="error">Error loading logs</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Logs</Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
        Live event stream with filtering and detail inspection.
      </Typography>

      <Card sx={{ mb: 2, position: 'sticky', top: 0, zIndex: 5 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Select
                fullWidth
                displayEmpty
                value={pluginId}
                onChange={(e) => setPluginId(e.target.value)}
                size="small"
              >
                <MenuItem value="">All Plugins</MenuItem>
                {(plugins || []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="Device ID"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="Entity ID"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip label={`${filtered.length} rows`} size="small" />
            <FormControlLabel
              control={<Switch checked={live} onChange={(e) => setLive(e.target.checked)} />}
              label="Live"
            />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>Plugin</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Entity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      selected={selectedLog?.id === row.id}
                      onClick={() => setSelectedLogID(row.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{new Date(row.created_at).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.kind} color={row.kind === 'command' ? 'secondary' : 'default'} />
                      </TableCell>
                      <TableCell>{row.kind === 'command' ? (row.state || 'pending') : row.name}</TableCell>
                      <TableCell>{row.plugin_id}</TableCell>
                      <TableCell>{row.device_id}</TableCell>
                      <TableCell>{row.entity_id}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No log rows found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Details</Typography>
              {!selectedLog && (
                <Typography variant="body2" color="textSecondary">Select a row to inspect details.</Typography>
              )}
              {selectedLog && (
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: '#0f172a',
                    color: '#e2e8f0',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: 12,
                    m: 0,
                  }}
                >
                  {JSON.stringify(selectedLog, null, 2)}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Logs;
