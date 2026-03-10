import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Button, Breadcrumbs, TextareaAutosize, Alert, Paper
} from '@mui/material';
import { Save, ChevronLeft } from 'lucide-react';

interface ScriptResponse {
  source: string;
}

interface ScriptStateResponse {
  state: Record<string, any>;
  path: string;
}

const ScriptManagerPage: React.FC = () => {
  const { pluginId, deviceId, entityId } = useParams<{ pluginId: string; deviceId: string; entityId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const scriptQuery = useQuery<ScriptResponse, Error>({
    queryKey: ['script', pluginId, deviceId, entityId],
    queryFn: async () => {
      const response = await axios.get<ScriptResponse>(
        `/api/plugins/${pluginId}/devices/${deviceId}/entities/${entityId}/script`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!pluginId && !!deviceId && !!entityId,
    select: (data) => data?.source ? { source: data.source } : { source: '' },
    retry: false, // Don't retry missing scripts
  });

  const stateQuery = useQuery<ScriptStateResponse, Error>({
    queryKey: ['script-state', pluginId, deviceId, entityId],
    queryFn: async () => {
      const response = await axios.get<ScriptStateResponse>(
        `/api/plugins/${pluginId}/devices/${deviceId}/entities/${entityId}/script/state`
      );
      return response.data;
    },
    staleTime: 30 * 1000,
    enabled: !!pluginId && !!deviceId && !!entityId,
    retry: false, // Don't retry missing state
  });

  const [scriptSource, setScriptSource] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update scriptSource state when scriptQuery data changes
  React.useEffect(() => {
    if (scriptQuery.data?.source !== undefined) {
      setScriptSource(scriptQuery.data.source);
    }
  }, [scriptQuery.data?.source]);

  const updateScriptMutation = useMutation<any, Error, { source: string }>({
    mutationFn: async (newScript: { source: string }) => {
      const response = await axios.put(
        `/api/plugins/${pluginId}/devices/${deviceId}/entities/${entityId}/script`,
        newScript
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the query to refetch script source and update UI
      queryClient.invalidateQueries({ queryKey: ['script', pluginId, deviceId, entityId] });
      setSaveError(null);
      // Optionally show a success message
    },
    onError: (error: any) => {
      setSaveError(error.response?.data?.error || error.message || 'Failed to save script');
    },
  });

  const handleSave = () => {
    updateScriptMutation.mutate({ source: scriptSource });
  };

  const renderStateBlock = () => {
    if (stateQuery.isLoading) return <CircularProgress size={20} />;
    if (stateQuery.isError) {
      const isNotFound = stateQuery.error instanceof axios.AxiosError && stateQuery.error.response?.status === 404;
      if (isNotFound) return <Typography variant="body2" color="textSecondary">No persistent state found for this script.</Typography>;
      return <Typography variant="body2" color="error">Error loading state: {stateQuery.error.message}</Typography>;
    }
    if (!stateQuery.data) return null;

    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>Script State (Read-only)</Typography>
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
          <Typography variant="caption" display="block" color="textSecondary" sx={{ mb: 1, fontFamily: 'monospace' }}>
            Source: {stateQuery.data.path}
          </Typography>
          <pre style={{ margin: 0, fontSize: '0.85rem', overflowX: 'auto' }}>
            {JSON.stringify(stateQuery.data.state, null, 2)}
          </pre>
        </Paper>
      </Box>
    );
  };

  if (scriptQuery.isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (scriptQuery.isError) {
    const isScriptNotFound = scriptQuery.error instanceof axios.AxiosError && scriptQuery.error.response?.status === 404;

    if (isScriptNotFound) {
      // If script not found, allow editing of an empty script
      return (
        <Box>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link to="/plugins" className="text-blue-600 hover:underline">Plugins</Link>
            <Link to={`/plugins/${pluginId}/devices`} className="text-blue-600 hover:underline">{pluginId}</Link>
            <Link to={`/plugins/${pluginId}/devices/${deviceId}/entities`} className="text-blue-600 hover:underline">{deviceId}</Link>
            <Typography color="textPrimary">{entityId}</Typography>
            <Typography color="textPrimary">Script</Typography>
          </Breadcrumbs>

          <Typography variant="h4" gutterBottom>
            Manage Script for {entityId}
          </Typography>

          <Button
            variant="outlined"
            startIcon={<ChevronLeft />}
            onClick={() => navigate(`/plugins/${pluginId}/devices/${deviceId}/entities`)}
            sx={{ mb: 2 }}
          >
            Back to Entities
          </Button>

          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              No script found for this entity. Start writing a new one below!
            </Alert>
            <Typography variant="h6" gutterBottom>Lua Script Source</Typography>
            <TextareaAutosize
              minRows={10}
              style={{ width: '100%', padding: '10px', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5', backgroundColor: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px' }}
              value={scriptSource}
              onChange={(e) => setScriptSource(e.target.value)}
            />
            {saveError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {saveError}
              </Alert>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={updateScriptMutation.isPending}
              sx={{ mt: 2 }}
            >
              {updateScriptMutation.isPending ? 'Saving...' : 'Save Script'}
            </Button>

            {renderStateBlock()}
          </Paper>
        </Box>
      );
    } else {
      // General error, show as alert
      return (
        <Alert severity="error">
          Error loading script: {scriptQuery.error.message}
        </Alert>
      );
    }
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/plugins" className="text-blue-600 hover:underline">Plugins</Link>
        <Link to={`/plugins/${pluginId}/devices`} className="text-blue-600 hover:underline">{pluginId}</Link>
        <Link to={`/plugins/${pluginId}/devices/${deviceId}/entities`} className="text-blue-600 hover:underline">{deviceId}</Link>
        <Typography color="textPrimary">{entityId}</Typography>
        <Typography color="textPrimary">Script</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        Manage Script for {entityId}
      </Typography>

      <Button
        variant="outlined"
        startIcon={<ChevronLeft />}
        onClick={() => navigate(`/plugins/${pluginId}/devices/${deviceId}/entities`)}
        sx={{ mb: 2 }}
      >
        Back to Entities
      </Button>

      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Lua Script Source</Typography>
        <TextareaAutosize
          minRows={10}
          style={{ width: '100%', padding: '10px', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5', backgroundColor: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px' }}
          value={scriptSource}
          onChange={(e) => setScriptSource(e.target.value)}
        />
        {saveError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {saveError}
          </Alert>
        )}
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={updateScriptMutation.isPending}
          sx={{ mt: 2 }}
        >
          {updateScriptMutation.isPending ? 'Saving...' : 'Save Script'}
        </Button>

        {renderStateBlock()}
      </Paper>
    </Box>
  );
};

export default ScriptManagerPage;
