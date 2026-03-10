import { useEffect, useRef, useState } from 'react';
import {
  Box, Chip, Drawer, IconButton, Tooltip, Typography,
} from '@mui/material';
import { X } from 'lucide-react';
import axios from 'axios';

interface TraceEntry {
  kind: 'event' | 'command';
  ts: string;
  name: string;
  event_key?: string;
  state?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pluginId: string;
  deviceId: string;
  entityId: string;
  entityName: string;
}

function stateColor(state?: string): 'default' | 'warning' | 'success' | 'error' {
  if (state === 'pending')   return 'warning';
  if (state === 'succeeded') return 'success';
  if (state === 'failed')    return 'error';
  return 'default';
}

function CodeLine({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Tooltip title={copied ? 'Copied!' : 'Click to copy'} placement="left">
      <Box
        onClick={copy}
        component="code"
        sx={{
          display: 'block',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          px: 1,
          py: 0.5,
          bgcolor: 'action.selected',
          borderRadius: 1,
          cursor: 'pointer',
          whiteSpace: 'pre',
          overflowX: 'auto',
          '&:hover': { bgcolor: 'action.focus' },
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
}

export function EntityTraceDrawer({ open, onClose, pluginId, deviceId, entityId, entityName }: Props) {
  const [entries, setEntries] = useState<TraceEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const cursorRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);

  const eventKey = `${pluginId}.${deviceId}.${entityId}`;

  // Reset when a new entity is traced or drawer opens
  useEffect(() => {
    if (!open) return;
    setEntries([]);
    setExpanded(new Set());
    cursorRef.current = new Date().toISOString();
  }, [open, entityId]);

  // Polling loop
  useEffect(() => {
    if (!open) return;

    const poll = async () => {
      try {
        const url = `/api/plugins/${pluginId}/devices/${deviceId}/entities/${entityId}/trace?since=${encodeURIComponent(cursorRef.current)}`;
        const { data } = await axios.get<TraceEntry[]>(url);
        if (data && data.length > 0) {
          setEntries(prev => [...prev, ...data]);
          cursorRef.current = data[data.length - 1].ts;
        }
      } catch {
        // ignore transient errors
      }
    };

    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [open, pluginId, deviceId, entityId]);

  // Auto-scroll to bottom when new entries arrive (unless paused)
  useEffect(() => {
    if (!pauseRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const toggleExpand = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 600, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Trace: {entityName}
        </Typography>
        <Chip label={`${entries.length} entries`} size="small" variant="outlined" />
        <IconButton size="small" onClick={onClose}><X size={16} /></IconButton>
      </Box>

      {/* Lua reference panel */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Lua reference
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption" color="textSecondary">Subscribe to events:</Typography>
          <CodeLine>{`Ctx:OnEvent("${eventKey}", "Handler")`}</CodeLine>
          <Typography variant="caption" color="textSecondary">Send a command:</Typography>
          <CodeLine>{`Ctx:SendCommand({ PluginID="${pluginId}", DeviceID="${deviceId}", EntityID="${entityId}", Payload={type="..."} })`}</CodeLine>
        </Box>
      </Box>

      {/* Log */}
      <Box
        ref={scrollRef}
        onMouseEnter={() => { pauseRef.current = true; }}
        onMouseLeave={() => {
          pauseRef.current = false;
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }}
        sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}
      >
        {entries.length === 0 && (
          <Typography variant="caption" color="textSecondary" sx={{ p: 1, display: 'block' }}>
            Waiting for activity...
          </Typography>
        )}
        {entries.map((e, i) => (
          <Box
            key={i}
            sx={{ mb: 0.5, p: 0.75, borderRadius: 1, bgcolor: 'action.hover', cursor: e.data ? 'pointer' : 'default' }}
            onClick={() => e.data && toggleExpand(i)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {new Date(e.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
              </Typography>

              <Chip
                label={e.kind.toUpperCase()}
                size="small"
                color={e.kind === 'event' ? 'info' : 'secondary'}
                sx={{ height: 18, fontSize: '0.65rem' }}
              />

              {e.kind === 'command' && e.state && (
                <Chip
                  label={e.state}
                  size="small"
                  color={stateColor(e.state)}
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}

              {/* The key field for Lua — EventRef.Type or Payload.type */}
              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}
              >
                {e.name || <span style={{ opacity: 0.4 }}>(unknown)</span>}
              </Typography>

              {e.kind === 'event' && e.name && (
                <Tooltip title={`EventRef.Type == "${e.name}"`} placement="top">
                  <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                    EventRef.Type
                  </Typography>
                </Tooltip>
              )}

              {e.kind === 'command' && e.name && (
                <Tooltip title={`Payload.type = "${e.name}"`} placement="top">
                  <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                    Payload.type
                  </Typography>
                </Tooltip>
              )}

              {e.error && (
                <Typography variant="caption" color="error" sx={{ fontFamily: 'monospace' }}>
                  — {e.error}
                </Typography>
              )}

              {e.data && (
                <Typography variant="caption" color="textSecondary">
                  {expanded.has(i) ? '▲' : '▼'}
                </Typography>
              )}
            </Box>

            {/* Inline Lua snippet for this specific event/command */}
            {expanded.has(i) && e.data && (
              <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {e.kind === 'event' && e.name && (
                  <CodeLine>{`-- EventRef.Type == "${e.name}"\n-- if EventRef.Type == "${e.name}" then ...`}</CodeLine>
                )}
                {e.kind === 'command' && e.name && (
                  <CodeLine>{`Ctx:SendCommand({ PluginID="${pluginId}", DeviceID="${deviceId}", EntityID="${entityId}", Payload={type="${e.name}"} })`}</CodeLine>
                )}
                <Box
                  component="pre"
                  sx={{ p: 0.75, bgcolor: 'background.paper', borderRadius: 1, overflow: 'auto', fontSize: '0.7rem', m: 0, fontFamily: 'monospace' }}
                >
                  {JSON.stringify(e.data, null, 2)}
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
