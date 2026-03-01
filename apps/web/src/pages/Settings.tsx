import React from 'react';
import { Typography, Box, Card, CardContent, TextField, Button, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface AppInfo {
  name: string;
  description: string;
  version: string;
  coreVersion: string;
}

const Settings: React.FC = () => {
  const { data, isLoading } = useQuery<AppInfo>({
    queryKey: ['app-info'],
    queryFn: async () => {
      const response = await axios.get('/api/info');
      return response.data;
    },
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Card>
        <CardContent>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="appName"
              label="Application Name"
              name="appName"
              defaultValue={data?.name || 'SlideBolt'}
            />
            <TextField
              margin="normal"
              fullWidth
              name="description"
              label="Description"
              id="description"
              defaultValue={data?.description || ''}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
              <Typography variant="caption" color="textSecondary">
                UI: {import.meta.env.VITE_APP_VERSION || 'dev'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                API: {data?.version || 'dev'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Core: {data?.coreVersion || 'unknown'}
              </Typography>
            </Box>
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Save Changes
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
