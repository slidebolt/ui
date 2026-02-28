import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Typography, Box, Card, CardContent, Grid, 
  CircularProgress, Breadcrumbs, Button
} from '@mui/material';
import { Cpu, ChevronRight } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  plugin_id: string;
}

const Devices: React.FC = () => {
  const { pluginId } = useParams<{ pluginId: string }>();

  const { data: devices, isLoading, error } = useQuery<Device[]>({
    queryKey: ['devices', pluginId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/plugins/${pluginId}/devices`);
        const data = Array.isArray(response.data) ? response.data : Object.values(response.data) as Device[];
        return data.sort((a, b) => a.name.localeCompare(b.name));
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
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Cpu className="text-purple-500" />
                  <Typography variant="h6">{device.name}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Model: {device.model || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  ID: {device.id}
                </Typography>
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
