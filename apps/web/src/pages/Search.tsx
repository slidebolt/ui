import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Typography, Box, Card, CardContent, Grid, 
  CircularProgress, TextField, Select, MenuItem, FormControl, InputLabel, Button,
  Chip
} from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('entities');
  const [activeSearch, setActiveSearch] = useState({ query: '', type: 'entities' });

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['search', activeSearch.type, activeSearch.query],
    queryFn: async () => {
      if (!activeSearch.query) return [];
      const response = await axios.get(`/api/search/${activeSearch.type}`, {
        params: { q: activeSearch.query }
      });
      return response.data || [];
    },
    enabled: !!activeSearch.query,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch({ query, type: searchType });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Search</Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={searchType}
                label="Type"
                onChange={(e) => setSearchType(e.target.value)}
              >
                <MenuItem value="plugins">Plugins</MenuItem>
                <MenuItem value="devices">Devices</MenuItem>
                <MenuItem value="entities">Entities</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Search Pattern (e.g., *, name*) — devices/plugins only"
              variant="outlined" 
              size="small" 
              fullWidth 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
      {error && <Typography color="error">Error performing search</Typography>}

      {results && results.length > 0 && (
        <Grid container spacing={2}>
          {results.map((item: any, i: number) => (
            <Grid item xs={12} key={i}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.name || item.local_name || item.id || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ID: {item.id}
                  </Typography>
                  {item.domain && (
                    <Typography variant="body2" color="textSecondary">
                      Domain: <Chip label={item.domain} size="small" sx={{ ml: 1 }} />
                    </Typography>
                  )}
                  {item.plugin_id && (
                    <Typography variant="body2" color="textSecondary">
                      Plugin: {item.plugin_id}
                    </Typography>
                  )}
                  <Box mt={1}>
                    <pre style={{ fontSize: '0.75rem', background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto' }}>
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {results && results.length === 0 && activeSearch.query && (
         <Typography variant="body1" color="textSecondary">No results found.</Typography>
      )}
    </Box>
  );
};

export default Search;
