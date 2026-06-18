import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth.types';
import toast from 'react-hot-toast';

// Layout
import Layout from '../components/layout/Layout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Standard Pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProductsPage from '../pages/products/ProductsPage';
import ProductDetailPage from '../pages/products/ProductDetailPage';
import InventoryPage from '../pages/inventory/InventoryPage';
import StockMovementsPage from '../pages/inventory/StockMovementsPage';
import StockRequestsPage from '../pages/inventory/StockRequestsPage';
import PurchaseOrdersPage from '../pages/orders/PurchaseOrdersPage';
import SalesOrdersPage from '../pages/orders/SalesOrdersPage';
import OrderDetailPage from '../pages/orders/OrderDetailPage';
import SuppliersPage from '../pages/suppliers/SuppliersPage';
import ReportsPage from '../pages/reports/ReportsPage';

import SettingsPage from '../pages/settings/SettingsPage';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Show Toast on permission check failure
    setTimeout(() => {
      toast.error('Access Denied: Insufficient Permissions');
    }, 0);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="products/:id"
          element={
            <ProtectedRoute>
              <ProductDetailPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="inventory"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="inventory/movements"
          element={
            <ProtectedRoute>
              <StockMovementsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="inventory/requests"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StockRequestsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="orders/purchase"
          element={
            <ProtectedRoute>
              <PurchaseOrdersPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="orders/sales"
          element={
            <ProtectedRoute>
              <SalesOrdersPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="suppliers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <SuppliersPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
