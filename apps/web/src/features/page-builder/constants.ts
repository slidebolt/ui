import { type CSSProperties } from 'react';

export const DRAG_MIME_TYPE = 'text/plain';

export const LIGHT_COLOR_SWATCHES = [
  '#ffffff',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#ef4444',
  '#0f172a',
];

export const MODULE_SURFACE_STYLE: CSSProperties = {
  width: 'fit-content',
  border: '1px solid #dbe5ef',
  borderRadius: 12,
  padding: 12,
  display: 'grid',
  gap: 10,
  background: '#ffffff',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
};

export const MODULE_LABEL_STYLE: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  fontWeight: 700,
  letterSpacing: 0.3,
};

export const MODULE_HEADER_STYLE: CSSProperties = {
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.2,
};

export const MODULE_VALUE_STYLE: CSSProperties = {
  fontSize: 12,
  color: '#334155',
  textAlign: 'center',
};

export const MODULE_INFO_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 13,
  color: '#334155',
};

export const MODULE_SLIDER_SX = {
  width: '100%',
  '& .MuiSlider-track': { border: 0 },
  '& .MuiSlider-rail': { opacity: 0.4 },
  '& .MuiSlider-thumb': {
    width: 16,
    height: 16,
    border: '2px solid #fff',
    boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
  },
  '& .MuiSlider-valueLabel': {
    borderRadius: 6,
    fontSize: 11,
  },
};
