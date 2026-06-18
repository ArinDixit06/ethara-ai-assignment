import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Truck,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  Shield,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import StatusBadge from '../common/StatusBadge';
import { useStockRequestStore } from '../../store/stockRequestStore';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, toggleRBACModal } = useUIStore();
  const { getPendingCount } = useStockRequestStore();
  const isAdmin = user?.role === 'ADMIN';
  const pendingRequestCount = isAdmin ? getPendingCount() : 0;

  const sections = [
    {
      title: 'General',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, adminOnly: false },
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Products',        to: '/products',          icon: Package,        adminOnly: false },
        { label: 'Inventory',       to: '/inventory',         icon: Layers,         adminOnly: false },
        { label: 'Stock Requests',  to: '/inventory/requests',icon: ClipboardList,  adminOnly: true  },
        { label: 'Purchase Orders', to: '/orders/purchase',   icon: ShoppingCart,   adminOnly: false },
        { label: 'Sales Orders',    to: '/orders/sales',      icon: Truck,          adminOnly: false },
      ]
    },
    {
      title: 'Directories & Reports',
      items: [
        { label: 'Suppliers', to: '/suppliers', icon: Users,    adminOnly: false },
        { label: 'Reports',   to: '/reports',   icon: BarChart2, adminOnly: false },
      ]
    },
    {
      title: 'Configurations',
      items: [
        { label: 'Settings', to: '/settings', icon: Settings, adminOnly: false },
      ]
    }
  ];

  return (
    <aside
      className={`flex flex-col bg-card border-r border-border h-screen sticky top-0 text-foreground transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Logo */}
      <div className="flex flex-col justify-center px-4 h-16 border-b border-border">
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-bold text-base text-slate-900 tracking-tight leading-none">
              <Layers className="w-5 h-5 text-slate-900" />
              <span>InventoryOS</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">Enterprise Edition</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto text-slate-900">
            <Layers className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            {!sidebarCollapsed && (
              <span className="text-[10px] uppercase font-bold text-slate-400/80 tracking-wider mb-1 px-3 block">
                {sec.title}
              </span>
            )}
          {sec.items.map((item) => {
              // Hide admin-only items from non-admins entirely
              if (item.adminOnly && !isAdmin) return null;
              const isRestricted = user?.role === 'STAFF' && (item.to === '/suppliers' || item.to === '/reports');
              const showBadge = item.to === '/inventory/requests' && isAdmin && pendingRequestCount > 0;
              return (
                <NavLink
                  key={item.label}
                  to={isRestricted ? '#' : item.to}
                  onClick={(e) => {
                    if (isRestricted) {
                      e.preventDefault();
                      toast.error(`Access Denied: ${item.label} requires Admin or Manager permission.`);
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isRestricted
                        ? 'text-muted-foreground/30 hover:bg-transparent cursor-not-allowed'
                        : isActive && item.to !== '#'
                        ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                  title={isRestricted ? `${item.label} requires Admin/Manager role` : undefined}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {showBadge && !sidebarCollapsed && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                        {pendingRequestCount}
                      </span>
                    )}
                    {showBadge && sidebarCollapsed && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                    {isRestricted && !sidebarCollapsed && (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Security & RBAC Interactive Mini-Card */}
        {!sidebarCollapsed && (
          <div className="mx-1 mt-6 p-3.5 bg-slate-50 border border-slate-205/60 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Shield className="w-4 h-4 text-slate-700" />
              <span>Security & RBAC Guide</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Review privileges and test different roles.
            </p>
            <button
              onClick={() => toggleRBACModal(true)}
              className="w-full text-center py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
            >
              Open Guide Matrix
            </button>
          </div>
        )}
      </nav>

      {/* User Info / Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        {!sidebarCollapsed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-foreground leading-tight">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate mb-1">
                  {user?.email}
                </p>
                <StatusBadge status={user?.role || 'STAFF'} className="text-[10px]" />
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center justify-center gap-2 w-full border border-transparent bg-rose-600 hover:bg-rose-750 text-white rounded-md py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20 cursor-pointer"
              title={`${user?.name} (${user?.role})`}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              onClick={() => logout()}
              className="rounded-md hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 p-2 text-muted-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
