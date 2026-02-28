import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, Typography, Grid, Box, CircularProgress } from '@mui/material';
import { Shield, Clock, HardDrive } from 'lucide-react';

interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
}

const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await axios.get('/api/health');
      return response.data;
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Typography color="error">Error loading system status</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>System Status</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent className="flex items-center gap-4">
              <Shield className="text-green-500 w-10 h-10" />
              <div>
                <Typography color="textSecondary" variant="subtitle2">Status</Typography>
                <Typography variant="h6">{data?.status.toUpperCase()}</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent className="flex items-center gap-4">
              <Clock className="text-blue-500 w-10 h-10" />
              <div>
                <Typography color="textSecondary" variant="subtitle2">Uptime</Typography>
                <Typography variant="h6">{Math.floor(data?.uptime || 0)}s</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent className="flex items-center gap-4">
              <HardDrive className="text-purple-500 w-10 h-10" />
              <div>
                <Typography color="textSecondary" variant="subtitle2">Version</Typography>
                <Typography variant="h6">{data?.version}</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
