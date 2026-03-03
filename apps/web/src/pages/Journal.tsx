import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Typography, Box, Card, CardContent, 
  CircularProgress, Table, TableBody, TableCell, TableHead, TableRow 
} from '@mui/material';

interface JournalEvent {
  event_id: string;
  name: string;
  plugin_id: string;
  device_id: string;
  entity_id: string;
  created_at: string;
}

const Journal: React.FC = () => {
  const { data: events, isLoading, error } = useQuery<JournalEvent[]>({
    queryKey: ['journal'],
    queryFn: async () => {
      const response = await axios.get('/api/journal/events');
      const data = Array.isArray(response.data) ? response.data : [];
      return data.sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.plugin_id.localeCompare(b.plugin_id);
      });
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Typography color="error">Error loading journal</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>System Journal</Typography>
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Plugin</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Entity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.event_id}>
                  <TableCell>{new Date(event.created_at).toLocaleTimeString()}</TableCell>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{event.plugin_id}</TableCell>
                  <TableCell>{event.device_id}</TableCell>
                  <TableCell>{event.entity_id}</TableCell>
                </TableRow>
              ))}
              {events?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No recent events.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Journal;
