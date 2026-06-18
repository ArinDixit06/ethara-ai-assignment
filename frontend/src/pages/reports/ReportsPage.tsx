import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Coins,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Boxes,
  Calendar,
  Building,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import reportsApi from '../../api/reports.api';
import productsApi from '../../api/products.api';
import inventoryApi from '../../api/inventory.api';
import { Product } from '../../types/product.types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

type TabType = 'VALUATION' | 'MOVEMENTS' | 'LOW_STOCK' | 'ORDERS';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('VALUATION');

  // Movements Filters
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Valuation Query
  const {
    data: valuationData,
    isLoading: isValuationLoading,
    refetch: refetchValuation,
  } = useQuery({
    queryKey: ['report-valuation'],
    queryFn: reportsApi.getInventoryValuation,
    enabled: activeTab === 'VALUATION',
  });

  // 2. Stock Movements Summary Query
  const movementsParams = {
    productId: selectedProductId || undefined,
    type: selectedType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };
  const {
    data: movementsData,
    isLoading: isMovementsLoading,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ['report-movements', movementsParams],
    queryFn: () => reportsApi.getStockMovements(movementsParams),
    enabled: activeTab === 'MOVEMENTS',
  });

  // 3. Low Stock Query
  const {
    data: lowStockData = [],
    isLoading: isLowStockLoading,
    refetch: refetchLowStock,
  } = useQuery({
    queryKey: ['report-lowstock'],
    queryFn: reportsApi.getLowStock,
    enabled: activeTab === 'LOW_STOCK',
  });

  // 4. Order Summary Query
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['report-orders'],
    queryFn: reportsApi.getOrderSummary,
    enabled: activeTab === 'ORDERS',
  });

  // Products dropdown fetch for movements filter
  const { data: productsRes } = useQuery({
    queryKey: ['products-dropdown-list'],
    queryFn: () => productsApi.getAll({ limit: 100 }),
    enabled: activeTab === 'MOVEMENTS',
  });
  const products: Product[] = productsRes?.data || [];

  const handleRefresh = () => {
    if (activeTab === 'VALUATION') refetchValuation();
    if (activeTab === 'MOVEMENTS') refetchMovements();
    if (activeTab === 'LOW_STOCK') refetchLowStock();
    if (activeTab === 'ORDERS') refetchOrders();
  };

  // CSV Exporters
  const handleExportValuation = () => {
    if (!valuationData?.products) return;
    const headers = ['Product ID', 'Name', 'SKU', 'Category', 'Current Stock', 'Cost Price (INR)', 'Total Valuation (INR)'];
    const csvContent = [
      headers.join(','),
      ...valuationData.products.map((p: any) => [
        p.productId,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        `"${p.category.replace(/"/g, '""')}"`,
        p.currentStock,
        p.costPrice,
        p.valuation,
      ].join(',')),
      ['Total Valuation', '', '', '', '', '', valuationData.totalValuation],
    ].join('\n');

    downloadCSVBlob(csvContent, 'inventory_valuation_report');
  };

  const handleExportMovements = async () => {
    try {
      const blob = await inventoryApi.exportMovementsCSV({
        productId: selectedProductId || undefined,
        type: selectedType as any || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `movements_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Movement report exported');
    } catch (e) {
      toast.error('Failed to download CSV');
    }
  };

  const handleExportLowStock = () => {
    if (!lowStockData || lowStockData.length === 0) return;
    const headers = ['Name', 'SKU', 'Category', 'Current Stock', 'Reorder Threshold', 'Unit'];
    const csvContent = [
      headers.join(','),
      ...lowStockData.map((p: any) => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.category?.name || 'Uncategorized',
        p.currentStock,
        p.reorderThreshold,
        p.unitOfMeasure,
      ].join(',')),
    ].join('\n');

    downloadCSVBlob(csvContent, 'low_stock_alert_report');
  };

  const handleExportOrders = () => {
    if (!ordersData?.supplierSpend) return;
    const headers = ['Supplier ID', 'Supplier Name', 'Total Spend (INR)'];
    const csvContent = [
      headers.join(','),
      ...ordersData.supplierSpend.map((s: any) => [
        s.supplierId,
        `"${s.supplierName.replace(/"/g, '""')}"`,
        s.spend,
      ].join(',')),
    ].join('\n');

    downloadCSVBlob(csvContent, 'supplier_spend_summary');
  };

  const downloadCSVBlob = (content: string, filenamePrefix: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report CSV exported');
  };

  // Group Low Stock products by Category
  const getGroupedLowStock = () => {
    const grouped: Record<string, any[]> = {};
    lowStockData.forEach((p: any) => {
      const cat = p.category?.name || 'Uncategorized';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(p);
    });
    return grouped;
  };

  const groupedLowStock = getGroupedLowStock();

  return (
    <div className="flex-1 flex flex-col space-y-6 text-foreground text-left w-full min-h-full">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Audit valuation summaries, movements logs, thresholds warnings, and suppliers spends</p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-1.5 border border-input bg-card text-foreground hover:bg-muted rounded-md px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Report
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border">
        {[
          { key: 'VALUATION', label: 'Inventory Valuation', icon: Coins },
          { key: 'MOVEMENTS', label: 'Stock Movements', icon: ClipboardList },
          { key: 'LOW_STOCK', label: 'Low Stock Alerts', icon: AlertTriangle },
          { key: 'ORDERS', label: 'Supplier Spends', icon: Building },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
              activeTab === tab.key
                ? 'border-primary text-primary font-bold bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs View Content */}

      {/* 1. VALUATION REPORT TAB */}
      {activeTab === 'VALUATION' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Inventory Valuation Breakdown</h3>
              <p className="text-xs text-muted-foreground">Detailed asset costs multiplying current stocks by buying price</p>
            </div>
            <button
              onClick={handleExportValuation}
              disabled={isValuationLoading || !valuationData}
              className="inline-flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary/95 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          {isValuationLoading ? (
            <LoadingSpinner size="md" className="my-10" />
          ) : !valuationData || valuationData.products?.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-lg">
              No products found to compile inventory valuation report.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5 text-right">Available Qty</th>
                      <th className="px-4 py-2.5 text-right">Cost Price</th>
                      <th className="px-4 py-2.5 text-right">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {valuationData.products.map((p: any) => (
                      <tr key={p.productId} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-foreground">{p.name}</td>
                        <td className="px-4 py-2.5"><code className="text-xs font-mono text-muted-foreground">{p.sku}</code></td>
                        <td className="px-4 py-2.5">{p.category}</td>
                        <td className="px-4 py-2.5 text-right">{p.currentStock}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(p.costPrice)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">{formatCurrency(p.valuation)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30">
                      <td colSpan={5} className="px-4 py-3.5 font-bold text-sm">Grand Total Inventory Asset Value</td>
                      <td className="px-4 py-3.5 text-right text-base font-extrabold text-primary">
                        {formatCurrency(valuationData.totalValuation)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. STOCK MOVEMENTS TAB */}
      {activeTab === 'MOVEMENTS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Stock Movement Summaries</h3>
              <p className="text-xs text-muted-foreground">Aggregated movement analytics filterable by ranges</p>
            </div>
            <button
              onClick={handleExportMovements}
              disabled={isMovementsLoading}
              className="inline-flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary/95 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          {/* Filtering panels */}
          <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-background border border-input rounded p-1 text-xs cursor-pointer text-foreground"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-background border border-input rounded p-1 text-xs cursor-pointer text-foreground"
              >
                <option value="">All Types</option>
                <option value="INBOUND">Inbound</option>
                <option value="OUTBOUND">Outbound</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background border border-input rounded p-1 text-xs cursor-pointer text-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-muted-foreground mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-background border border-input rounded p-1 text-xs cursor-pointer text-foreground"
              />
            </div>
          </div>

          {isMovementsLoading ? (
            <LoadingSpinner size="md" className="my-10" />
          ) : !movementsData || movementsData.movements?.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-lg">
              No stock movements history recorded matching filter query.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Aggregation summaries */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total Events</span>
                  <p className="text-lg font-bold mt-1 text-foreground">{movementsData.summary?.totalMovements || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase text-emerald-600 dark:text-emerald-400">Total Inbound Qty</span>
                  <p className="text-lg font-bold mt-1 text-foreground">{movementsData.summary?.inbound?.quantity || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase text-rose-600 dark:text-rose-405">Total Outbound Qty</span>
                  <p className="text-lg font-bold mt-1 text-foreground">{movementsData.summary?.outbound?.quantity || 0}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase text-amber-500">Adjustments Qty</span>
                  <p className="text-lg font-bold mt-1 text-foreground">{movementsData.summary?.adjustment?.quantity || 0}</p>
                </div>
              </div>

              {/* Table Movements Logs */}
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5">Date & Time</th>
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5 text-right">Quantity</th>
                        <th className="px-4 py-2.5 text-right">New Stock</th>
                        <th className="px-4 py-2.5">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {movementsData.movements.slice(0, 50).map((m: any) => (
                        <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-2.5 text-muted-foreground">{formatDateTime(m.createdAt)}</td>
                          <td className="px-4 py-2.5 font-medium text-foreground">{m.product?.name}</td>
                          <td className="px-4 py-2.5"><StatusBadge status={m.type} className="text-[10px]" /></td>
                          <td className="px-4 py-2.5 text-right font-bold">
                            {m.type === 'INBOUND' ? '+' : m.type === 'OUTBOUND' ? '-' : ''}
                            {m.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-foreground">{m.newStock}</td>
                          <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[150px]">{m.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. LOW STOCK WARNINGS TAB */}
      {activeTab === 'LOW_STOCK' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Low Stock Threshold Alerts</h3>
              <p className="text-xs text-muted-foreground">Items currently below minimum safety thresholds grouped by category</p>
            </div>
            <button
              onClick={handleExportLowStock}
              disabled={isLowStockLoading || lowStockData.length === 0}
              className="inline-flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary/95 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          {isLowStockLoading ? (
            <LoadingSpinner size="md" className="my-10" />
          ) : lowStockData.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-lg">
              Stock levels healthy! No products below threshold limit.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedLowStock).map((catName) => (
                <div key={catName} className="bg-card border border-border rounded-xl shadow-sm p-4 text-xs">
                  <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 border-b border-border/80 pb-2 mb-3">
                    Category: {catName} ({groupedLowStock[catName].length} items)
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px]">
                          <th className="py-2">Product Name</th>
                          <th className="py">SKU</th>
                          <th className="py text-right">Available Stock</th>
                          <th className="py text-right">Min Threshold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {groupedLowStock[catName].map((p: any) => (
                          <tr key={p.id}>
                            <td className="py-2.5 font-medium text-foreground">{p.name}</td>
                            <td className="py-2.5"><code className="bg-muted px-1 py-0.5 rounded font-mono text-[10px] text-muted-foreground">{p.sku}</code></td>
                            <td className="py-2.5 text-right font-bold text-rose-500">{p.currentStock} {p.unitOfMeasure}</td>
                            <td className="py-2.5 text-right text-muted-foreground">{p.reorderThreshold} {p.unitOfMeasure}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. PURCHASE ORDER SUMMARY TAB */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Supplier Spend Metrics</h3>
              <p className="text-xs text-muted-foreground">Cumulative spends and PO status allocations</p>
            </div>
            <button
              onClick={handleExportOrders}
              disabled={isOrdersLoading || !ordersData}
              className="inline-flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary/95 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          {isOrdersLoading ? (
            <LoadingSpinner size="md" className="my-10" />
          ) : !ordersData ? (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card border border-border rounded-lg">
              No orders summary logged in database.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: PO Status breakdown counts */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                  Orders by Status
                </h4>
                
                <div className="space-y-2 text-xs">
                  {ordersData.ordersByStatus?.length === 0 ? (
                    <p className="text-muted-foreground italic">No purchase or sales orders drafted.</p>
                  ) : (
                    ordersData.ordersByStatus.map((g: any) => (
                      <div key={g.status} className="flex justify-between items-center p-2 bg-muted/40 rounded">
                        <StatusBadge status={g.status} className="text-[10px]" />
                        <span className="font-bold text-foreground">{g.count} orders</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Suppliers spends lists */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                  Procurement Expense per Supplier
                </h4>

                <div className="overflow-x-auto text-xs">
                  {ordersData.supplierSpend?.length === 0 ? (
                    <p className="text-muted-foreground italic">No billing spends history tracked.</p>
                  ) : (
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                          <th className="py-2">Supplier Name</th>
                          <th className="py text-right">Cumulative Spend (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {ordersData.supplierSpend.map((s: any) => (
                          <tr key={s.supplierId} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2.5 font-semibold text-foreground">{s.supplierName}</td>
                            <td className="py-2.5 text-right font-bold text-primary">{formatCurrency(s.spend)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
