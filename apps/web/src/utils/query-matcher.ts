export type QueryData = {
  name: string;
  type: 'query';
  query: {
    pattern?: string;
    where?: Array<{
      field: string;
      op: string;
      value: any;
    }>;
  };
};

export function matchesQuery(entityKey: string, entityData: any, query: QueryData['query']): boolean {
  if (!query) return false;
  
  // Basic glob matcher for pattern: > matches everything
  if (query.pattern && query.pattern !== '>' && entityKey !== query.pattern && !entityKey.startsWith(query.pattern.replace('>', ''))) {
    return false;
  }

  if (query.where && query.where.length > 0) {
    for (const f of query.where) {
      const parts = f.field.split('.');
      let val: any = entityData;
      for (const p of parts) {
        val = val?.[p];
      }

      if (f.op === 'eq') {
        if (Array.isArray(val)) {
          if (!val.includes(f.value)) return false;
        } else if (val !== f.value) {
          return false;
        }
      } else if (f.op === 'ne') {
        if (Array.isArray(val)) {
          if (val.includes(f.value)) return false;
        } else if (val === f.value) {
          return false;
        }
      }
    }
  }

  return true;
}
