import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Menu, AlertTriangle, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { inventoryApi } from '../../api/inventory.api';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, toggleRBACModal } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Fetch low stock items for notifications badge
  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock-notifications'],
    queryFn: inventoryApi.getLowStock,
    refetchInterval: 30000, // check every 30 seconds
  });

  // Determine dynamic breadcrumb based on path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/dashboard') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Home</span>
          <span className="text-[10px] text-slate-350">&gt;</span>
          <span className="text-slate-800 font-semibold">Dashboard</span>
        </div>
      );
    }
    if (path.startsWith('/products')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Directories</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span className="text-slate-800 font-semibold">Products</span>
        </div>
      );
    }
    if (path.startsWith('/inventory')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Pages</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span>Products</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span className="text-slate-800 font-semibold">Inventory Overview</span>
        </div>
      );
    }
    if (path.startsWith('/orders/purchase')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Pages</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span>Orders</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span className="text-slate-800 font-semibold">Purchase Orders</span>
        </div>
      );
    }
    if (path.startsWith('/orders/sales')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Pages</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span>Orders</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span className="text-slate-800 font-semibold">Sales Orders</span>
        </div>
      );
    }
    if (path.startsWith('/suppliers')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Directories</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span className="text-slate-800 font-semibold">Suppliers</span>
        </div>
      );
    }
    if (path.startsWith('/reports')) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Analytics</span>
          <span className="text-[10px] text-slate-350">/</span>
          <span className="text-slate-800 font-semibold">Reports</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <span>System</span>
        <span className="text-[10px] text-slate-350">/</span>
        <span className="text-slate-800 font-semibold">Settings</span>
      </div>
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Redirect to products with query param
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-25 text-slate-900 shadow-sm">
      {/* Sidebar toggle button + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center rounded-lg hover:bg-slate-100 p-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          {getBreadcrumbs()}
        </div>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground/60">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/50 transition-colors"
          />
        </div>
      </form>

      {/* Action Icons */}
      <div className="flex items-center gap-4 ml-auto">
        {/* RBAC Guide Button */}
        <button
          onClick={() => {
            toggleRBACModal(true);
            setIsNotificationsOpen(false);
            setIsUserMenuOpen(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          title="Open Role Permissions Guide"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">RBAC Guide</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsUserMenuOpen(false);
            }}
            className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white ring-2 ring-card animate-bounce">
                {lowStockItems.length}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 rounded-md border border-border bg-card text-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border mb-1">
                  <span className="font-semibold text-sm">Notifications</span>
                  {lowStockItems.length > 0 && (
                    <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full">
                      {lowStockItems.length} low stock
                    </span>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {lowStockItems.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No new alerts. Stock levels healthy!
                    </div>
                  ) : (
                    lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          navigate(`/products/${item.id}`);
                        }}
                        className="flex items-start gap-2.5 p-2 rounded hover:bg-muted cursor-pointer transition-colors text-left"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            SKU: {item.sku} • Stock: <span className="font-semibold text-rose-500">{item.currentStock}</span> (Threshold: {item.reorderThreshold})
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full md:rounded-md md:px-2 md:py-1.5 hover:bg-muted transition-colors focus:outline-none"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:block text-sm font-medium pr-1">
              {user?.name?.split(' ')[0]}
            </span>
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card text-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-border text-left">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-rose-600 dark:text-rose-450 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
