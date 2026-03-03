import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Typography, Box, Card, CardContent, Grid, 
  CircularProgress, Breadcrumbs, Button
} from '@mui/material';
import { Cpu, ChevronRight } from 'lucide-react';
import { LabelEditor } from '../components/LabelEditor';

interface Device {
  id: string;
  local_name: string;
  source_id: string;
  source_name: string;
  labels?: Record<string, string[]>;
}

const Devices: React.FC = () => {
  const { pluginId } = useParams<{ pluginId: string }>();
  const queryClient = useQueryClient();

  const { data: devices, isLoading, error } = useQuery<Device[]>({
    queryKey: ['devices', pluginId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/plugins/${pluginId}/devices`);
        const data = Array.isArray(response.data) ? response.data : Object.values(response.data) as Device[];
        return data.sort((a, b) => a.local_name.localeCompare(b.local_name));
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 404 || err.response?.status === 500) {
          return []; // Treat "Method not found" or "Forbidden" on devices as empty list
        }
        throw err;
      }
    },
    retry: false,
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Typography color="error">Error loading devices</Typography>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/plugins" className="text-blue-600 hover:underline">Plugins</Link>
        <Typography color="textPrimary">{pluginId}</Typography>
        <Typography color="textPrimary">Devices</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>Devices for {pluginId}</Typography>

      <Grid container spacing={3}>
        {devices?.map((device) => (
          <Grid item xs={12} md={6} lg={4} key={device.id}>
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Cpu className="text-purple-500" />
                  <Typography variant="h6">{device.local_name}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Source: {device.source_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ID: {device.id}
                </Typography>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                    Labels
                  </Typography>
                  <LabelEditor
                    labels={device.labels}
                    onSave={async (labels) => {
                      await axios.put(`/api/plugins/${pluginId}/devices`, {
                        id: device.id,
                        local_name: device.local_name,
                        source_id: device.source_id,
                        source_name: device.source_name,
                        labels
                      });
                      queryClient.invalidateQueries({ queryKey: ['devices', pluginId] });
                    }}
                  />
                </Box>
                <Button 
                  component={Link} 
                  to={`/plugins/${pluginId}/devices/${device.id}/entities`}
                  variant="outlined" 
                  size="small"
                  endIcon={<ChevronRight size={16} />}
                  fullWidth
                >
                  View Entities
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {devices?.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" align="center" sx={{ mt: 4, color: 'text.secondary' }}>
              No devices found for this plugin.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Devices;
