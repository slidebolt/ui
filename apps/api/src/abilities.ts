import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

export type Action  = 'manage' | 'read' | 'write';
export type Subject = 'Device' | 'Entity' | 'Script' | 'Command' | 'User' | 'Role' | 'all';
export type AppAbility = MongoAbility<[Action, Subject]>;

export type RoleName = 'admin' | 'operator' | 'viewer' | string;

/** Build a CASL ability for a list of role names. */
export function buildAbility(roleNames: RoleName[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  for (const role of roleNames) {
    switch (role) {
      case 'admin':
        can('manage', 'all');
        break;
      case 'operator':
        can('read',  'Device');
        can('write', 'Device');
        can('read',  'Entity');
        can('write', 'Entity');
        can('read',  'Script');
        can('write', 'Script');
        can('write', 'Command');
        break;
      case 'viewer':
        can('read', 'Device');
        can('read', 'Entity');
        break;
    }
  }

  return build();
}

/** Built-in role permission definitions (for seeding). */
export const BUILT_IN_ROLE_PERMISSIONS: Record<string, Array<{ action: Action; subject: Subject }>> = {
  admin:    [{ action: 'manage', subject: 'all' }],
  operator: [
    { action: 'read',  subject: 'Device'  },
    { action: 'write', subject: 'Device'  },
    { action: 'read',  subject: 'Entity'  },
    { action: 'write', subject: 'Entity'  },
    { action: 'read',  subject: 'Script'  },
    { action: 'write', subject: 'Script'  },
    { action: 'write', subject: 'Command' },
  ],
  viewer: [
    { action: 'read', subject: 'Device' },
    { action: 'read', subject: 'Entity' },
  ],
};
