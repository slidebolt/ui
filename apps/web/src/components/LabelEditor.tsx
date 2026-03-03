import React, { useState } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Chip, Stack, Alert
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';

interface LabelEditorProps {
  labels?: Record<string, string[]>;
  onSave: (labels: Record<string, string[]>) => Promise<void>;
  disabled?: boolean;
}

interface LabelPair {
  key: string;
  value: string;
}

export const LabelEditor: React.FC<LabelEditorProps> = ({ labels = {}, onSave, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [labelPairs, setLabelPairs] = useState<LabelPair[]>(
    Object.entries(labels).flatMap(([key, values]) =>
      (Array.isArray(values) ? values : [values]).map(value => ({ key, value }))
    )
  );
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleAddLabel = () => {
    setLabelPairs([...labelPairs, { key: '', value: '' }]);
  };

  const handleRemoveLabel = (index: number) => {
    setLabelPairs(labelPairs.filter((_, i) => i !== index));
  };

  const handleLabelChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...labelPairs];
    updated[index] = { ...updated[index], [field]: value };
    setLabelPairs(updated);
  };

  const handleSave = async () => {
    setError(undefined);
    
    // Validate labels
    for (const { key, value } of labelPairs) {
      if (key && !value) {
        setError(`Value required for key "${key}"`);
        return;
      }
      if (!key && value) {
        setError(`Key required for value "${value}"`);
        return;
      }
    }

    const newLabels: Record<string, string[]> = {};
    for (const { key, value } of labelPairs) {
      if (key && value) {
        if (!newLabels[key]) newLabels[key] = [];
        newLabels[key].push(value);
      }
    }

    try {
      setLoading(true);
      await onSave(newLabels);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save labels');
    } finally {
      setLoading(false);
    }
  };

  const hasLabels = Object.keys(labels).length > 0;

  return (
    <>
      <Box display="flex" gap={1} flexWrap="wrap">
        {Object.entries(labels).flatMap(([key, values]) =>
          (Array.isArray(values) ? values : [values]).map((value, i) => (
            <Chip
              key={`${key}-${i}`}
              label={`${key}: ${value}`}
              variant="outlined"
              size="small"
              onClick={() => setOpen(true)}
            />
          ))
        )}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Plus size={14} />}
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          {hasLabels ? 'Edit' : 'Add'} Labels
        </Button>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Labels</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          
          <Stack spacing={2}>
            {labelPairs.map((pair, idx) => (
              <Box key={idx} display="flex" gap={1} alignItems="flex-start">
                <TextField
                  placeholder="Key"
                  value={pair.key}
                  onChange={(e) => handleLabelChange(idx, 'key', e.target.value)}
                  size="small"
                  sx={{ flexGrow: 0, width: 120 }}
                />
                <TextField
                  placeholder="Value"
                  value={pair.value}
                  onChange={(e) => handleLabelChange(idx, 'value', e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveLabel(idx)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Box>
            ))}
          </Stack>

          <Button
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={handleAddLabel}
            sx={{ alignSelf: 'flex-start' }}
          >
            Add Label
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
