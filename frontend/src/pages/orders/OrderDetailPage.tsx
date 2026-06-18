import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  Info,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  PackageX,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ordersApi from '../../api/orders.api';
import { Order, OrderStatus } from '../../types/order.types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { usePermissions } from '../../hooks/usePermissions';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canEditOrderStatus } = usePermissions();

  // 1. Fetch Order details
  const {
    data: order,
    isLoading: isOrderLoading,
    isError: isOrderError,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  // State transitions mutations
  const createTransitionMutation = (apiMethod: (id: string) => Promise<Order>, successMessage: string) => {
    return useMutation({
      mutationFn: () => apiMethod(id!),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['order-detail', id] });
        queryClient.invalidateQueries({ queryKey: ['orders-purchase'] });
        queryClient.invalidateQueries({ queryKey: ['orders-sales'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['low-stock-notifications'] });
        toast.success(successMessage);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to update order status');
      },
    });
  };

  const confirmMutation = createTransitionMutation(ordersApi.confirm, 'Order confirmed successfully');
  const shipMutation = createTransitionMutation(ordersApi.ship, 'Purchase order marked as shipped');
  const receiveMutation = createTransitionMutation(ordersApi.receive, 'Inventory received! Stock quantities updated');
  const packMutation = createTransitionMutation(ordersApi.pack, 'Sales order marked as packed');
  const dispatchMutation = createTransitionMutation(ordersApi.dispatch, 'Sales order dispatched for delivery');
  const fulfillMutation = createTransitionMutation(ordersApi.fulfill, 'Sales order fulfilled! Outbound stock deducted');
  const cancelMutation = createTransitionMutation(ordersApi.cancel, 'Order cancelled');

  const handleBack = () => {
    if (order?.type === 'PURCHASE') {
      navigate('/orders/purchase');
    } else {
      navigate('/orders/sales');
    }
  };

  if (isOrderLoading) {
    return <LoadingSpinner size="lg" className="my-20" />;
  }

  if (isOrderError || !order) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border text-foreground">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Order Not Found</h3>
        <p className="text-sm text-muted-foreground mb-6">The order you are trying to view does not exist or has been deleted.</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 border border-input bg-card text-foreground px-4 py-2 rounded-md hover:bg-muted text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            onClick={() => refetchOrder()}
            className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/95 text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isPurchase = order.type === 'PURCHASE';
  const lineItems = order.lineItems || [];
  const statusHistory = order.statusHistory || [];
  const isPacked = statusHistory.some((h) => h.notes && h.notes.toLowerCase().includes('packed'));

  return (
    <div className="flex-1 flex flex-col space-y-6 text-foreground text-left w-full min-h-full">
      {/* Detail Header Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
        <button
          onClick={handleBack}
          className="inline-flex items-center justify-center gap-1.5 border border-input bg-card hover:bg-muted text-foreground rounded-md px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to List
        </button>

        <div className="flex items-center gap-2">
          {/* Action Transition panel */}
          {canEditOrderStatus ? (
            <div className="flex items-center gap-2">
              
              {/* PURCHASE status transitions */}
              {isPurchase ? (
                <>
                  {order.status === 'DRAFT' && (
                    <button
                      onClick={() => confirmMutation.mutate()}
                      disabled={confirmMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => shipMutation.mutate()}
                      disabled={shipMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition-colors"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === 'SHIPPED' && (
                    <button
                      onClick={() => receiveMutation.mutate()}
                      disabled={receiveMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition-colors"
                    >
                      Mark as Received
                    </button>
                  )}
                </>
              ) : (
                /* SALES status transitions */
                <>
                  {order.status === 'DRAFT' && (
                    <button
                      onClick={() => confirmMutation.mutate()}
                      disabled={confirmMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}
                  {order.status === 'CONFIRMED' && !isPacked && (
                    <button
                      onClick={() => packMutation.mutate()}
                      disabled={packMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition-colors"
                    >
                      Mark as Packed
                    </button>
                  )}
                  {order.status === 'CONFIRMED' && isPacked && (
                    <button
                      onClick={() => dispatchMutation.mutate()}
                      disabled={dispatchMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition-colors"
                    >
                      Mark as Dispatched
                    </button>
                  )}
                  {order.status === 'SHIPPED' && (
                    <button
                      onClick={() => fulfillMutation.mutate()}
                      disabled={fulfillMutation.isPending}
                      className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition-colors"
                    >
                      Mark as Fulfilled
                    </button>
                  )}
                </>
              )}

              {/* Cancel Button */}
              {order.status !== 'FULFILLED' && order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && (
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="inline-flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-semibold px-3.5 py-2 rounded-md transition-colors animate-in"
                >
                  Cancel Order
                </button>
              )}
            </div>
          ) : (
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold border border-slate-200 cursor-not-allowed"
              title="Modifying order workflows requires Admin/Manager role"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Workflow Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Meta Order specs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cards: Order Info and Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {order.type} ORDER DETAILS
                </span>
                <h2 className="text-xl font-bold font-mono tracking-tight">{order.orderNumber}</h2>
              </div>
              <StatusBadge status={order.status} className="text-sm px-3.5 py-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                {isPurchase ? (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">Supplier</span>
                      <p className="font-semibold">{order.supplier?.name || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground">Customer Name</span>
                        <p className="font-semibold">{order.customerName || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground">Customer Contact</span>
                        <p className="font-semibold">{order.customerContact || '-'}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Expected Date</span>
                    <p className="font-semibold">{formatDate(order.expectedDate)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Created By</span>
                    <p className="font-semibold">{order.createdBy?.name || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Created Date</span>
                    <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground font-semibold">Notes</span>
                <p className="text-muted-foreground mt-1 bg-muted/30 rounded p-2 italic leading-relaxed">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold mb-4 pb-2 border-b border-border/60 uppercase tracking-wider text-muted-foreground">
              Order Items
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                    <th className="py-2.5 px-3">Product Catalog Item</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-foreground">{item.product?.name}</td>
                      <td className="py-2.5 px-3">
                        <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-muted-foreground">
                          {item.product?.sku}
                        </code>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {item.quantity} {item.product?.unitOfMeasure || 'pcs'}
                      </td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/10">
                    <td colSpan={3} className="py-3 px-3 font-bold border-t border-border">Total Amount</td>
                    <td colSpan={2} className="py-3 px-3 text-right text-lg font-black text-primary border-t border-border">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right Card: Status History Timeline */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold mb-6 pb-2 border-b border-border/60 uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Tracking Timeline</span>
          </h3>

          <div className="flex-1 space-y-6 relative border-l-2 border-border/70 ml-2.5 pl-5 text-xs text-left">
            {statusHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No status updates recorded.</div>
            ) : (
              statusHistory.map((hist, index) => {
                const isFirst = index === 0;
                return (
                  <div key={hist.id} className="relative group animate-in slide-in-from-left-2 duration-150">
                    {/* Ring dot Indicator */}
                    <div
                      className={`absolute left-[-26px] top-0 rounded-full w-3.5 h-3.5 border-2 bg-card ${
                        isFirst
                          ? 'border-primary ring-2 ring-primary/20 scale-110'
                          : 'border-muted-foreground/60'
                      }`}
                    />
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <StatusBadge status={hist.status} className="text-[10px]" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDateTime(hist.createdAt)}
                        </span>
                      </div>
                      {hist.notes && (
                        <p className="text-muted-foreground bg-muted/40 rounded p-2 italic leading-relaxed">
                          {hist.notes}
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
    </div>
  );
};

export default OrderDetailPage;
