import type { AppUser } from '../api';

export function useAppPermissions(user: AppUser | null) {
  const hasPermission = (permissionKey: string) => !!user?.permissions?.includes(permissionKey);

  return {
    canViewPatients: hasPermission('view.patients'),
    canViewDonations: hasPermission('view.donations'),
    canViewColloquiums: hasPermission('view.colloquiums'),
    canViewCoordinations: hasPermission('view.coordinations'),
    canViewReports: hasPermission('view.reports'),
    canViewAdmin: hasPermission('view.admin'),
  };
}
