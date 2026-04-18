import { toHavePermission } from '../toHavePermission.js';

describe('toHavePermission', () => {
  const testUser = {
    id: 'user1',
    permissions: ['read:posts', 'write:posts'],
    roles: [
      {
        name: 'editor',
        permissions: ['edit:posts', 'delete:posts']
      }
    ]
  };

  it('should pass for direct permission', async () => {
    const result = await toHavePermission.call({} as any, testUser, 'read:posts');
    expect(result.pass).toBe(true);
  });

  it('should pass for role-based permission', async () => {
    const result = await toHavePermission.call({} as any, testUser, 'edit:posts');
    expect(result.pass).toBe(true);
  });

  it('should fail for missing permission', async () => {
    const result = await toHavePermission.call({} as any, testUser, 'admin:system');
    expect(result.pass).toBe(false);
  });

  it('should handle user without permissions or roles', async () => {
    const userWithoutPerms = { id: 'user2' };
    const result = await toHavePermission.call({} as any, userWithoutPerms, 'read:posts');
    expect(result.pass).toBe(false);
  });

  it('should handle user with empty permissions and roles', async () => {
    const userWithEmpty = {
      id: 'user3',
      permissions: [],
      roles: []
    };
    const result = await toHavePermission.call({} as any, userWithEmpty, 'read:posts');
    expect(result.pass).toBe(false);
  });
});