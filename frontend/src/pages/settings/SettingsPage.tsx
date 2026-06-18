import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Save, User, Shield, Building2, Sliders, CheckCircle2, Lock, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import authApi from '../../api/auth.api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { isAdmin, isManager } = usePermissions();
  const canEditSettings = isAdmin || isManager;

  // Local storage / state backing for mock settings
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('cfg_company_name') || 'InventoryOS Ltd');
  const [currency, setCurrency] = useState(() => localStorage.getItem('cfg_currency') || 'INR');
  const [defaultThreshold, setDefaultThreshold] = useState(() => Number(localStorage.getItem('cfg_def_threshold') || '10'));
  const [autoSku, setAutoSku] = useState(() => localStorage.getItem('cfg_auto_sku') !== 'false');
  const [lowStockAlerts, setLowStockAlerts] = useState(() => localStorage.getItem('cfg_low_stock_alerts') !== 'false');

  // Admin Operator Creation State
  const [opName, setOpName] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [opPassword, setOpPassword] = useState('');
  const [opRole, setOpRole] = useState<'STAFF' | 'MANAGER' | 'ADMIN'>('STAFF');
  const [isCreatingOp, setIsCreatingOp] = useState(false);

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (opPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    setIsCreatingOp(true);
    try {
      await authApi.register({
        name: opName,
        email: opEmail,
        password: opPassword,
        role: opRole,
      });
      toast.success(`Operator ${opName} (${opRole}) registered successfully!`);
      setOpName('');
      setOpEmail('');
      setOpPassword('');
      setOpRole('STAFF');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create operator account.';
      toast.error(msg);
    } finally {
      setIsCreatingOp(false);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cfg_company_name', companyName);
    localStorage.setItem('cfg_currency', currency);
    localStorage.setItem('cfg_def_threshold', defaultThreshold.toString());
    toast.success('General system settings updated successfully!');
  };

  const handleSaveControls = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cfg_auto_sku', autoSku.toString());
    localStorage.setItem('cfg_low_stock_alerts', lowStockAlerts.toString());
    toast.success('Inventory controls updated successfully!');
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 text-left font-sans w-full min-h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage enterprise profile, operational defaults, and user session statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-slate-900" />
            <h3 className="text-sm font-semibold text-slate-900">General Profile Configurations</h3>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEditSettings}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-white disabled:bg-slate-50 border border-slate-200 rounded-lg text-slate-900 disabled:text-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Valuation Currency
                </label>
                <select
                  value={currency}
                  disabled={!canEditSettings}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-white disabled:bg-slate-50 border border-slate-200 rounded-lg text-slate-900 disabled:text-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                >
                  <option value="INR">INR (₹) Indian Rupee</option>
                  <option value="USD">USD ($) US Dollar</option>
                  <option value="EUR">EUR (€) Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Reorder Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  disabled={!canEditSettings}
                  value={defaultThreshold}
                  onChange={(e) => setDefaultThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white disabled:bg-slate-50 border border-slate-200 rounded-lg text-slate-900 disabled:text-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              {canEditSettings ? (
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save General Settings
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Settings Locked (Requires Admin/Manager)
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Profile & Operator Admin Wrapper */}
        <div className="space-y-6">
          {/* User Session Profile Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <User className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm font-semibold text-slate-900">Operator Profile</h3>
              </div>

              <div className="flex flex-col items-center text-center py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-xl font-bold mb-3">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h4 className="text-base font-bold text-slate-900">{user?.name}</h4>
                <p className="text-xs text-slate-550">{user?.email}</p>

                <div className="mt-4 flex items-center gap-1 bg-slate-900 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  {user?.role}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Session Domain:</span>
                <span className="font-mono text-slate-700">localhost:5173</span>
              </div>
            </div>
          </div>

          {/* Admin Operator Creation Card */}
          {isAdmin && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <UserPlus className="w-5 h-5 text-slate-900" />
                <h3 className="text-sm font-semibold text-slate-900">Create Operator Account</h3>
              </div>
              
              <form onSubmit={handleCreateOperator} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Smith"
                    value={opName}
                    onChange={(e) => setOpName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alice@company.com"
                    value={opEmail}
                    onChange={(e) => setOpEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Password (min 6 chars)"
                    value={opPassword}
                    onChange={(e) => setOpPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Role Scope
                  </label>
                  <select
                    value={opRole}
                    onChange={(e) => setOpRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="STAFF">Sales Employee (STAFF)</option>
                    <option value="MANAGER">Operations Manager (MANAGER)</option>
                    <option value="ADMIN">Administrator (ADMIN)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingOp}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingOp ? 'Creating User...' : 'Register Operator'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Stock Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-slate-900" />
            <h3 className="text-sm font-semibold text-slate-900">Inventory Management & Alerts</h3>
          </div>

          <form onSubmit={handleSaveControls} className="space-y-5">
            <div className="space-y-4">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-slate-900">Auto-Generate Product SKUs</h4>
                  <p className="text-[11px] text-slate-500">Automatically combine category name prefixes and codes on creation</p>
                </div>
                <label className={`relative inline-flex items-center select-none ${canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="checkbox"
                    checked={autoSku}
                    disabled={!canEditSettings}
                    onChange={(e) => setAutoSku(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-slate-900">Low Stock Push Warnings</h4>
                  <p className="text-[11px] text-slate-500">Display persistent system-wide alerts and badges when items fall below thresholds</p>
                </div>
                <label className={`relative inline-flex items-center select-none ${canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="checkbox"
                    checked={lowStockAlerts}
                    disabled={!canEditSettings}
                    onChange={(e) => setLowStockAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>

            <div className="pt-2">
              {canEditSettings ? (
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Controls
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Controls Locked (Requires Admin/Manager)
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
