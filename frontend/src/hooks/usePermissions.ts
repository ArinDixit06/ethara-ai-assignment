import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth.types';

export const usePermissions = () => {
  const { user } = useAuthStore();
  const role: UserRole | undefined = user?.role;

  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isStaff = role === 'STAFF';

  // Role permissions
  const canManageUsers = isAdmin;
  const canManageProducts = isAdmin || isManager;
  const canManageSuppliers = isAdmin || isManager;
  const canAdjustStock = isAdmin; // Only ADMIN can directly adjust stock
  const canRequestStockAdjust = isManager || isStaff; // Others submit a request to admin
  const canCreatePurchaseOrder = isAdmin || isManager;
  const canCreateSalesOrder = isAdmin || isManager || isStaff;
  const canEditOrderStatus = isAdmin || isManager;
  const canDeleteOrder = isAdmin; // Admin only for deleting DRAFT orders

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  return {
    role,
    user,
    isAdmin,
    isManager,
    isStaff,
    canManageUsers,
    canManageProducts,
    canManageSuppliers,
    canAdjustStock,
    canRequestStockAdjust,
    canCreatePurchaseOrder,
    canCreateSalesOrder,
    canEditOrderStatus,
    canDeleteOrder,
    hasRole,
  };
};

export default usePermissions;
