import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import RBACGuideModal from '../common/RBACGuideModal';

export const Layout: React.FC = () => {
  return (
    <div className="flex bg-background min-h-screen text-foreground overflow-x-hidden">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <Topbar />

        {/* Page Body Viewport */}
        <main className="flex-1 flex flex-col p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/10 overflow-y-auto">
          <div className="flex-1 flex flex-col w-full mx-auto animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Interactive RBAC Guide Modal */}
      <RBACGuideModal />
    </div>
  );
};

export default Layout;
