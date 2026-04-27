import React, { createContext, useContext, useMemo } from 'react';
import { useEntity, Entity as EntityType } from '../../store/entityStore';
import { getUIProperties, EntityUIProps } from '../../utils/entity-adapter';

type EntityContextValue = {
  entity: EntityType;
  ui: EntityUIProps;
};

const EntityContext = createContext<EntityContextValue | null>(null);

export function useEntityContext() {
  const context = useContext(EntityContext);
  if (!context) throw new Error('Entity sub-components must be used within <Entity.Item />');
  return context;
}

export function EntityItem({ entityKey, children }: { entityKey: string; children: React.ReactNode }) {
  const entity = useEntity(entityKey);

  const contextValue = useMemo(() => {
    if (!entity) return null;
    return {
      entity,
      ui: getUIProperties(entity.data),
    };
  }, [entity]);

  if (!contextValue) return null;

  return (
    <EntityContext.Provider value={contextValue}>
      {children}
    </EntityContext.Provider>
  );
}
