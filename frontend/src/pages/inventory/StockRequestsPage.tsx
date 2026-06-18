import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  ClipboardList,
  Clock,
  CheckCheck,
  XCircle,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Filter,
  Package,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStockRequestStore, StockAdjustmentRequest, RequestStatus } from '../../store/stockRequestStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import inventoryApi from '../../api/inventory.api';

const formatReqDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const AdjTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'ADD') return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
  if (type === 'REMOVE') return <TrendingDown className="w-3.5 h-3.5 text-rose-600" />;
  return <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />;
};

const statusConfig: Record<RequestStatus, { label: string; dot: string; badge: string }> = {
  PENDING:  { label: 'Pending',  dot: 'bg-amber-400',   badge: 'bg-amber-50 border-amber-200 text-amber-700'   },
  APPROVED: { label: 'Approved', dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  REJECTED: { label: 'Rejected', dot: 'bg-rose-400',    badge: 'bg-rose-50 border-rose-200 text-rose-700'       },
};

const rowBg: Record<RequestStatus, string> = {
  PENDING:  'bg-white hover:bg-amber-50/40',
  APPROVED: 'bg-emerald-50/20 hover:bg-emerald-50/40',
  REJECTED: 'bg-rose-50/10 hover:bg-rose-50/30',
};

export const StockRequestsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { requests, approveRequest, rejectRequest, getPendingCount } = useStockRequestStore();
  const queryClient = useQueryClient();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');

  const pendingCount = getPendingCount();
  const totalCount = requests.length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  const filtered = statusFilter === 'ALL'
    ? requests
    : requests.filter(r => r.status === statusFilter);

  // Approve mutation — calls real /inventory/adjust API
  const approveMutation = useMutation({
    mutationFn: async (req: StockAdjustmentRequest) => {
      // Sanitise values coming back from localStorage (JSON round-trip can turn
      // undefined → null and numbers might be stored as strings in older entries)
      const quantity = Math.max(1, Math.round(Number(req.quantity)));
      const reason = (req.reason && String(req.reason).trim()) || 'Manual Adjustment';
      const notes = req.notes ? String(req.notes).trim() || undefined : undefined;

      return inventoryApi.adjustStock({
        productId: req.productId,
        type: req.adjustmentType,
        quantity,
        reason,
        notes,
      });
    },
    onSuccess: (res, req) => {
      approveRequest(req.id, user?.name || 'Admin');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-notifications'] });
      toast.success(`✅ Applied: ${req.productName} stock → ${res.product.currentStock} ${req.unitOfMeasure}`);
      setExpandedId(null);
    },
    onError: (err: any, req) => {
      toast.error(err.response?.data?.message || `Failed to apply adjustment for ${req.productName}`);
    },
  });

  const handleApprove = (req: StockAdjustmentRequest) => {
    approveMutation.mutate(req);
  };

  const handleReject = (req: StockAdjustmentRequest) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectRequest(req.id, user?.name || 'Admin', rejectReason.trim());
    toast.success(`Request for "${req.productName}" rejected`);
    setRejectingId(null);
    setRejectReason('');
    setExpandedId(null);
  };

  const pills: { key: RequestStatus | 'ALL'; label: string; count: number }[] = [
    { key: 'ALL',      label: 'All Requests', count: totalCount   },
    { key: 'PENDING',  label: 'Pending',       count: pendingCount },
    { key: 'APPROVED', label: 'Approved',      count: approvedCount },
    { key: 'REJECTED', label: 'Rejected',      count: rejectedCount },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6 text-left w-full min-h-full">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Adjustment Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review, approve, or reject stock change requests submitted by Managers and Staff
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-sm font-bold px-3.5 py-1.5 rounded-full animate-pulse shadow-sm shrink-0">
            <Clock className="w-4 h-4" />
            {pendingCount} Pending Review
          </div>
        )}
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests',  value: totalCount,    color: 'text-slate-800',   bg: 'bg-slate-50',    border: 'border-slate-200' },
          { label: 'Pending',         value: pendingCount,  color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200' },
          { label: 'Approved',        value: approvedCount, color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
          { label: 'Rejected',        value: rejectedCount, color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4 flex flex-col gap-1`}>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</span>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        {pills.map(p => {
          const isActive = statusFilter === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setStatusFilter(p.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {p.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Requests List ── */}
      {/* NOTE: No flex-1 or overflow-hidden here — those were clipping expanded
           row content and hiding action buttons. Let this grow with its content
           and let the page scroll naturally. */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              {statusFilter === 'PENDING' ? (
                <Clock className="w-7 h-7 text-slate-300" />
              ) : (
                <CheckCheck className="w-7 h-7 text-slate-300" />
              )}
            </div>
            <p className="text-base font-semibold text-slate-500">
              {statusFilter === 'ALL' ? 'No requests yet' : `No ${statusFilter.toLowerCase()} requests`}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {statusFilter === 'PENDING'
                ? 'All caught up — no pending items to review'
                : 'Requests from your team will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((req) => {
              const isExpanded = expandedId === req.id;
              const isRejectingThis = rejectingId === req.id;
              const isPending = req.status === 'PENDING';
              const sc = statusConfig[req.status];

              return (
                <div key={req.id} className={`transition-colors first:rounded-t-xl last:rounded-b-xl ${rowBg[req.status]}`}>

                  {/* ── Row ── */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  >
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${sc.dot} ${isPending ? 'animate-pulse' : ''}`} />

                    {/* Product & request info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{req.productName}</span>
                        <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{req.productSku}</code>
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        {/* Change summary */}
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <AdjTypeIcon type={req.adjustmentType} />
                          <span className="font-semibold">
                            {req.adjustmentType === 'SET'
                              ? `Set to ${req.quantity}`
                              : req.adjustmentType === 'ADD'
                              ? `+${req.quantity}`
                              : `-${req.quantity}`}{' '}
                            {req.unitOfMeasure}
                          </span>
                          <span className="text-slate-400">· {req.reason}</span>
                        </span>
                        {/* Requester */}
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Package className="w-3 h-3" />
                          {req.requestedBy}
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{req.requestedByRole}</span>
                        </span>
                        {/* Date */}
                        <span className="text-[11px] text-slate-400">{formatReqDate(req.requestedAt)}</span>
                      </div>
                    </div>

                    {/* Right: status badge + chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.badge}`}>
                        {sc.label}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />
                      }
                    </div>
                  </div>

                  {/* ── Expanded Detail Panel ── */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4 bg-slate-50/50">

                      {/* Detail cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Current Stock',   value: `${req.currentStock} ${req.unitOfMeasure}` },
                          { label: 'Change Type',     value: req.adjustmentType },
                          { label: 'Amount',          value: req.adjustmentType === 'SET' ? `= ${req.quantity}` : req.adjustmentType === 'ADD' ? `+${req.quantity}` : `-${req.quantity}` },
                          { label: 'Requested By',    value: `${req.requestedBy} (${req.requestedByRole})` },
                        ].map(d => (
                          <div key={d.label} className="bg-white border border-slate-200 rounded-lg p-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.label}</span>
                            <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{d.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Notes */}
                      {req.notes && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes from Requester</span>
                          <p className="text-sm text-slate-600 mt-1 italic">"{req.notes}"</p>
                        </div>
                      )}

                      {/* Review info (approved/rejected) */}
                      {req.reviewedBy && (
                        <div className={`border rounded-lg p-3 flex items-start gap-2.5 ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-rose-50 border-rose-200'
                        }`}>
                          {req.status === 'APPROVED'
                            ? <CheckCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          }
                          <div className="text-xs">
                            <span className="font-bold text-slate-700">
                              {req.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {req.reviewedBy}
                            </span>
                            {req.reviewedAt && (
                              <span className="text-slate-500 ml-1">· {formatReqDate(req.reviewedAt)}</span>
                            )}
                            {req.rejectionReason && (
                              <p className="text-rose-700 mt-1">Reason: {req.rejectionReason}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── Action Buttons (PENDING only) ── */}
                      {isPending && (
                        <div className="space-y-3">
                          {!isRejectingThis ? (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={approveMutation.isPending}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                {approveMutation.isPending ? 'Applying to inventory...' : 'Approve & Apply to Inventory'}
                              </button>
                              <button
                                onClick={() => { setRejectingId(req.id); setRejectReason(''); }}
                                className="inline-flex items-center justify-center gap-2 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Rejection Reason <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                autoFocus
                                placeholder="e.g. Stock count was recently verified, no adjustment needed"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleReject(req)}
                                className="w-full px-3 py-2.5 text-sm border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-slate-800"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReject(req)}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Confirm Rejection
                                </button>
                                <button
                                  onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockRequestsPage;
