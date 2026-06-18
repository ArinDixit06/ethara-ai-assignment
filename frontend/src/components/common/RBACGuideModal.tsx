import React from 'react';
import { X, Shield, ShieldAlert, ShieldCheck, Check, Lock, Info, Key, User } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { usePermissions } from '../../hooks/usePermissions';
import StatusBadge from './StatusBadge';

export const RBACGuideModal: React.FC = () => {
  const { isRBACModalOpen, toggleRBACModal } = useUIStore();
  const { role, user } = usePermissions();

  if (!isRBACModalOpen) return null;

  const rolesDetails = [
    {
      name: 'ADMIN',
      title: '👑 Administrator',
      desc: 'Owner level access. Unrestricted permission across all business modules, analytics, user operators configuration and parameters settings.',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200/50',
    },
    {
      name: 'MANAGER',
      title: '💼 Operations Manager',
      desc: 'Supervises operational tasks. Can read/write/adjust catalog products, categories, suppliers, and purchase/sales orders. Restricted from deletion operations and managing other users.',
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-200/50',
    },
    {
      name: 'STAFF',
      title: '👤 Sales Employee (Staff)',
      desc: 'Front-line agent. Can browse catalog and stock levels, view purchase order states, and create sales orders. Strictly blocked from dashboard valuation metrics, adjusting stock directly, deactivations, settings, and suppliers directory.',
      color: 'text-slate-605 dark:text-slate-400 bg-slate-500/10 border-slate-200/50',
    },
  ];

  const permissionsMatrix = [
    { feature: 'View Product Catalog & Stock Levels', admin: true, manager: true, staff: true },
    { feature: 'Add/Edit Catalog Products & Categories', admin: true, manager: true, staff: false },
    { feature: 'Deactivate / Delete Products (Soft Delete)', admin: true, manager: false, staff: false },
    { feature: 'View Suppliers & Payment Terms', admin: true, manager: true, staff: false },
    { feature: 'Manage Suppliers (Add/Edit/Delete)', admin: true, manager: true, staff: false },
    { feature: 'Adjust Stock Quantities Directly (Audit)', admin: true, manager: true, staff: false },
    { feature: 'View Analytical Financial Reports & Valuation', admin: true, manager: true, staff: false },
    { feature: 'Create & Process Purchase Orders (Inbound)', admin: true, manager: true, staff: false },
    { feature: 'Create & Dispatch Sales Orders (Outbound)', admin: true, manager: true, staff: true },
    { feature: 'System Settings & Threshold Tuning', admin: true, manager: true, staff: false },
    { feature: 'Operator User Directory CRUD Control', admin: true, manager: false, staff: false },
  ];

  const demoAccounts = [
    { email: 'admin@example.com', password: 'Password123!', role: 'ADMIN', badge: 'Admin User' },
    { email: 'manager@example.com', password: 'Password123!', role: 'MANAGER', badge: 'Manager User' },
    { email: 'staff@example.com', password: 'Password123!', role: 'STAFF', badge: 'Sales Employee' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click closer */}
      <div className="absolute inset-0" onClick={() => toggleRBACModal(false)} />

      {/* Modal Box */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Role-Based Access Control (RBAC) Guide
              </h3>
              <p className="text-xs text-slate-500">
                Evaluating the permission structures, restrictions, and demo endpoints
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleRBACModal(false)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Current Session Profile Indicator */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/65 dark:border-slate-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-none">Your Session Profile</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{user?.name || 'Guest User'}</span>
                  {role ? <StatusBadge status={role} /> : <span className="text-xs text-slate-400">Not Signed In</span>}
                </div>
              </div>
            </div>
            
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 block">Logged in as:</span>
              <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-350">{user?.email || 'N/A'}</span>
            </div>
          </div>

          {/* Explanation Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-500" />
              Overview of Permission Tiers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {rolesDetails.map((rd) => (
                <div 
                  key={rd.name} 
                  className={`border rounded-lg p-3.5 space-y-2 transition-all ${
                    role === rd.name 
                      ? 'bg-slate-900 border-slate-800 shadow-md scale-[1.02] text-slate-350' 
                      : 'bg-white dark:bg-slate-800/20 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold leading-none ${role === rd.name ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {rd.title}
                    </span>
                    {role === rd.name && (
                      <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {rd.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Feature Matrix Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              RBAC Functional Matrix
            </h4>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                    <th className="py-2.5 px-3">System Feature</th>
                    <th className="py-2.5 px-2 text-center w-20">Admin</th>
                    <th className="py-2.5 px-2 text-center w-20">Manager</th>
                    <th className="py-2.5 px-2 text-center w-20">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                  {permissionsMatrix.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors ${
                        // Highlight rows that are restricted for staff/sales employee to make it clear what staff cannot do
                        !item.staff ? 'bg-amber-50/15 dark:bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-medium">
                        {item.feature}
                        {!item.staff && (
                          <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 font-semibold px-1 rounded">
                            Restricted
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {item.admin ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {item.manager ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {item.staff ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test Evaluator Autofill Accounts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-500" />
              Demo Accounts & Quick Testing
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              To evaluate how the UI and server adapt instantly to different permission scopes, you can sign out and log back in using any of the seeded credentials. Quick fill helpers are available on the <span className="font-semibold">Login Page</span> as well.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {demoAccounts.map((acc) => (
                <div key={acc.email} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-850/30 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{acc.badge}</span>
                    <span className="text-[11px] font-semibold text-slate-900 dark:text-white block mt-0.5">{acc.email}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">PW: {acc.password}</span>
                  </div>
                  <span className={`text-[9px] font-bold self-start px-2 py-0.5 rounded uppercase ${
                    acc.role === 'ADMIN' 
                      ? 'bg-rose-100 text-rose-800' 
                      : acc.role === 'MANAGER'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-200 text-slate-700'
                  }`}>
                    {acc.role} Scope
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            Enforced by Server-Side JWT Middlewares
          </span>
          <button
            onClick={() => toggleRBACModal(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow transition-colors cursor-pointer"
          >
            Dismiss Guide
          </button>
        </div>

      </div>
    </div>
  );
};

export default RBACGuideModal;
