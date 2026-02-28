import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Typography, Box, Card, CardContent, Grid, 
  CircularProgress, Chip, Divider, Button 
} from '@mui/material';
import { Link } from 'react-router-dom';
import { ToyBrick } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface PluginResponse {
  [key: string]: {
    manifest: {
      id: string;
      name: string;
      version: string;
      description?: string;
    };
    status?: string;
  };
}

const Plugins: React.FC = () => {
  const { data: plugins, isLoading, error } = useQuery<Plugin[]>({
    queryKey: ['plugins'],
    queryFn: async () => {
      const response = await axios.get<PluginResponse>('/api/plugins');
      const data = response.data;
      
      return Object.entries(data).map(([key, value]) => ({
        id: value.manifest.id || key,
        name: value.manifest.name,
        description: value.manifest.description,
        status: value.status || 'active',
      })).sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Typography color="error">Error loading plugins</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Plugins</Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Management and configuration of system plugins.
      </Typography>

      <Grid container spacing={3}>
        {plugins?.map((plugin) => (
          <Grid item xs={12} md={6} lg={4} key={plugin.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <ToyBrick className="text-blue-500" />
                  <Typography variant="h6">{plugin.name}</Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: '3em' }}>
                  {plugin.description || 'No description provided.'}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    ID: {plugin.id}
                  </Typography>
                  <Chip 
                    label={plugin.status || 'Active'} 
                    size="small" 
                    color={plugin.status === 'error' ? 'error' : 'success'} 
                  />
                </Box>
                <Button 
                  component={Link} 
                  to={`/plugins/${plugin.id}/devices`}
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Manage Devices
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {plugins?.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" align="center" sx={{ mt: 4, color: 'text.secondary' }}>
              No plugins found.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Plugins;
