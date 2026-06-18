import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Coins,
  AlertTriangle,
  FileClock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Label,
} from 'recharts';
import reportsApi from '../../api/reports.api';
import inventoryApi from '../../api/inventory.api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

// Curated theme colors for Charts
const CHART_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. Dashboard stats (metrics + chart data)
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportsApi.getDashboardStats,
  });

  // 2. Low stock items list
  const {
    data: lowStockProducts = [],
    isLoading: isLowStockLoading,
    refetch: refetchLowStock,
  } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: reportsApi.getLowStock,
  });

  // 3. Recent activity list (movements)
  const {
    data: recentMovementsRes,
    isLoading: isRecentMovementsLoading,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ['dashboard-recent-movements'],
    queryFn: () => inventoryApi.getMovements({ limit: 10 }),
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchLowStock();
    refetchMovements();
  };

  const handleReorder = (product: any) => {
    // Navigate to create purchase order, pre-selecting this product in query state
    navigate('/orders/purchase', {
      state: { preselectedProductId: product.id, preselectedUnitCost: product.costPrice },
    });
  };

  if (isStatsLoading || isLowStockLoading || isRecentMovementsLoading) {
    return <LoadingSpinner size="lg" className="my-20" />;
  }

  if (isStatsError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Failed to load dashboard metrics</h3>
        <p className="text-sm text-muted-foreground mb-6">There was an issue fetching the dashboard data from the server.</p>
        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/95 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Format activity feed item logs
  const activities = recentMovementsRes?.data || [];

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full min-h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time inventory valuation and operations analytics</p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center justify-center gap-1.5 border border-input bg-card text-foreground hover:bg-muted rounded-md px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>


      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm flex items-center justify-between card-animate">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Products</p>
            <h3 className="text-2xl font-bold tracking-tight">{stats.totalProducts}</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              Active items catalog
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Valuation */}
        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm flex items-center justify-between card-animate">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inventory Value</p>
            <h3 className="text-2xl font-bold tracking-tight">{formatCurrency(stats.totalInventoryValue)}</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              Cumulative cost value
            </p>
          </div>
          <div className="p-3 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm flex items-center justify-between card-animate">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock Items</p>
            <h3 className={`text-2xl font-bold tracking-tight ${stats.lowStockCount > 0 ? 'text-amber-500' : ''}`}>
              {stats.lowStockCount}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {stats.lowStockCount > 0 ? 'Requires stock replenishing' : 'Stock levels healthy'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${stats.lowStockCount > 0 ? 'bg-amber-500/15 text-amber-500 animate-pulse' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm flex items-center justify-between card-animate">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Orders</p>
            <h3 className="text-2xl font-bold tracking-tight">{stats.pendingOrdersCount}</h3>
            <p className="text-[10px] text-muted-foreground">Confirmed or Shipped orders</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
            <FileClock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inbound vs Outbound Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-semibold">Stock Movements (Last 7 Days)</h4>
            <p className="text-xs text-muted-foreground">Total inbound vs outbound items transferred daily</p>
          </div>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stockMovementsLast7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => formatDate(val, 'dd MMM')} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelFormatter={(label) => formatDate(label, 'dd MMMM yyyy')}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="inbound" name="Inbound Stock" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" name="Outbound Stock" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Value by Category Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-semibold">Category Inventory</h4>
            <p className="text-xs text-muted-foreground">Proportional cost breakdown of categories</p>
          </div>
          <div className="h-72 w-full flex-1">
            {stats.inventoryValueByCategory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center">No inventory valuation records found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.inventoryValueByCategory}
                    dataKey="value"
                    nameKey="category"
                    cx="40%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {stats.inventoryValueByCategory.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                    {/* Center label rendered by Recharts — always stays inside the donut */}
                    <Label
                      content={({ viewBox }: any) => {
                        const { cx, cy } = viewBox;
                        return (
                          <g>
                            <text
                              x={cx}
                              y={cy - 6}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-foreground"
                              style={{ fontSize: '20px', fontWeight: 700 }}
                            >
                              {stats.totalProducts}
                            </text>
                            <text
                              x={cx}
                              y={cy + 14}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              style={{ fontSize: '9px', fontWeight: 700, fill: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                            >
                              SKUs
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(71, 85, 105, 0.5)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(val) => formatCurrency(Number(val))}
                  />
                  {/* Vertical legend on the right — each category gets its own row, no overlap */}
                  <Legend
                    iconSize={8}
                    iconType="circle"
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: '10px', lineHeight: '20px', paddingLeft: '8px', maxWidth: '38%' }}
                    formatter={(value: string) => (
                      <span style={{ color: 'var(--muted-foreground, #94a3b8)', fontSize: '10px' }}>
                        {value.length > 14 ? value.slice(0, 13) + '…' : value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Items table */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold">Stock Warnings</h4>
              <p className="text-xs text-muted-foreground">Products below the reorder point</p>
            </div>
            {lowStockProducts.length > 0 && (
              <span className="text-[10px] bg-rose-500/10 text-rose-500 font-semibold px-2 py-0.5 rounded-full">
                {lowStockProducts.length} critical
              </span>
            )}
          </div>

          <div className="overflow-x-auto flex-1">
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Package className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs">No low stock items. All inventory levels healthy.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Available</th>
                    <th className="py-2.5 px-3 text-right">Threshold</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lowStockProducts.slice(0, 5).map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2 px-3 font-medium text-foreground max-w-[150px] truncate">{p.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{p.sku}</td>
                      <td className={`py-2 px-3 text-right font-semibold ${p.currentStock === 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                        {p.currentStock} {p.unitOfMeasure}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{p.reorderThreshold}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleReorder(p)}
                          className="inline-flex items-center justify-center gap-1 bg-primary text-white text-[10px] font-semibold px-2 py-1 rounded hover:bg-primary/95 transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          Reorder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-semibold">Recent Activity Feed</h4>
            <p className="text-xs text-muted-foreground">Last 10 stock intake/transfer activities</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[260px] pr-1">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No recent stock movements recorded.
              </div>
            ) : (
              activities.map((act: any) => {
                const isPositive = act.type === 'INBOUND';
                const isAdjustment = act.type === 'ADJUSTMENT';

                return (
                  <div key={act.id} className="flex items-start gap-2.5 border-b border-border/40 pb-2.5 last:border-b-0 last:pb-0">
                    <div className={`mt-0.5 p-1 rounded ${
                      isPositive 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : isAdjustment 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-450'
                    }`}>
                      {isPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                          {act.type}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {formatDateTime(act.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                        {act.product.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Qty: <span className="font-medium text-foreground">{act.quantity}</span> • User: {act.createdBy.name}
                      </p>
                      {act.reason && (
                        <p className="text-[9px] italic text-muted-foreground bg-muted/40 rounded px-1 py-0.5 mt-1 truncate">
                          Reason: {act.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating Plus Action Button */}
      <button
        onClick={() => navigate('/products')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all z-40 cursor-pointer"
        title="Go to Product Catalog"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default DashboardPage;
