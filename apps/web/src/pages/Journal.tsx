import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Typography, Box, Card, CardContent, 
  CircularProgress, Table, TableBody, TableCell, TableHead, TableRow 
} from '@mui/material';

interface JournalEvent {
  id: string;
  type: string;
  source: string;
  payload: any;
  timestamp: string;
}

const Journal: React.FC = () => {
  const { data: events, isLoading, error } = useQuery<JournalEvent[]>({
    queryKey: ['journal'],
    queryFn: async () => {
      const response = await axios.get('/api/journal/events');
      const data = Array.isArray(response.data) ? response.data : [];
      return data.sort((a, b) => {
        const typeCompare = a.type.localeCompare(b.type);
        if (typeCompare !== 0) return typeCompare;
        return a.source.localeCompare(b.source);
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
                <TableCell>Type</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Data</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{new Date(event.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>{event.type}</TableCell>
                  <TableCell>{event.source}</TableCell>
                  <TableCell>{JSON.stringify(event.payload)}</TableCell>
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
