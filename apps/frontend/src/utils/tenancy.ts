import type { User } from '@/AuthContext';

interface TenancySource {
  tenantId?: string;
  agencyId?: string;
  workspaceId?: string;
  metadata?: Record<string, any>;
  configuration?: Record<string, any>;
  workspace?: { id?: string; tenantId?: string; agencyId?: string };
}

export interface TenancyFilterOptions {
  user: User | null;
  workspaceId?: string | null;
  isSuperAdmin?: boolean;
  isAnyAgencyAdmin?: boolean;
}

const resolveTenancy = (item: TenancySource) => {
  const metadata = item?.metadata || {};
  const configuration = item?.configuration || {};
  const workspace = item?.workspace || {};

  return {
    tenantId:
      item?.tenantId ||
      metadata.tenantId ||
      configuration.tenantId ||
      workspace.tenantId,
    agencyId:
      item?.agencyId ||
      metadata.agencyId ||
      configuration.agencyId ||
      workspace.agencyId,
    workspaceId:
      item?.workspaceId ||
      metadata.workspaceId ||
      configuration.workspaceId ||
      workspace.id,
  };
};

export const filterByTenancyContext = <T extends TenancySource>(
  items: T[],
  options: TenancyFilterOptions
): T[] => {
  const { user, workspaceId, isSuperAdmin, isAnyAgencyAdmin } = options;

  if (!user || isSuperAdmin) return items;

  return items.filter((item) => {
    const tenancy = resolveTenancy(item);

    if (isAnyAgencyAdmin) {
      if (tenancy.agencyId && tenancy.agencyId !== user.agencyId) {
        return false;
      }
    } else if (tenancy.tenantId && tenancy.tenantId !== user.tenantId) {
      return false;
    }

    if (workspaceId && tenancy.workspaceId && tenancy.workspaceId !== workspaceId) {
      return false;
    }

    return true;
  });
};
