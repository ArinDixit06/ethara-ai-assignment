import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Trash2,
  ListFilter,
} from 'lucide-react';
import EmptyState from './EmptyState';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  enableSelection?: boolean;
  onBulkDelete?: (selectedRows: TData[]) => void;
  // Server-side pagination support (optional)
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    onPageChange: (index: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  enableSelection = false,
  onBulkDelete,
  serverPagination,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);

  // Setup table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: !!serverPagination,
    pageCount: serverPagination?.pageCount ?? -1,
  });

  const selectedRows = table.getSelectedRowModel().flatRows.map((r) => r.original);

  const currentPage = serverPagination
    ? serverPagination.pageIndex + 1
    : table.getState().pagination.pageIndex + 1;

  const totalPages = serverPagination
    ? serverPagination.pageCount
    : table.getPageCount();

  const pageSize = serverPagination
    ? serverPagination.pageSize
    : table.getState().pagination.pageSize;

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Table toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Bulk Action Bar */}
        <div className="flex-1 flex items-center gap-2">
          {enableSelection && selectedRows.length > 0 && (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <span className="text-xs font-semibold text-primary">
                {selectedRows.length} item{selectedRows.length > 1 ? 's' : ''} selected
              </span>
              {onBulkDelete && (
                <button
                  onClick={() => onBulkDelete(selectedRows)}
                  className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-750 text-white rounded px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Column Visibility Selector */}
        <div className="relative">
          <button
            onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
            className="inline-flex items-center justify-center gap-2 border border-input bg-card text-foreground rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ListFilter className="w-4 h-4 text-muted-foreground" />
            Columns
          </button>

          {isVisibilityOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsVisibilityOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card text-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 max-h-60 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Toggle Columns
                </div>
                {table
                  .getAllLeafColumns()
                  .filter((col) => col.id !== 'select' && col.id !== 'actions')
                  .map((column) => {
                    const headerText = typeof column.columnDef.header === 'string' 
                      ? column.columnDef.header 
                      : column.id;
                    return (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        <span className="capitalize">{headerText}</span>
                      </label>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-foreground">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-semibold select-none"
                      style={{ width: header.column.columnDef.size }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-1.5 ${
                            header.column.getCanSort() ? 'cursor-pointer hover:text-foreground' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-muted-foreground/65">
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? ' ↕️'}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="animate-pulse">
                  {columns.map((_, colIndex) => (
                    <td key={`skeleton-td-${colIndex}`} className="px-4 py-3.5">
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  <EmptyState
                    title="No data found"
                    description="There are no items matching your request."
                  />
                </td>
              </tr>
            ) : (
              // Data rows
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={`hover:bg-muted/40 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${row.getIsSelected() ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const size = Number(e.target.value);
                if (serverPagination) {
                  serverPagination.onPageSizeChange(size);
                } else {
                  table.setPageSize(size);
                }
              }}
              className="bg-card text-foreground border border-input rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="hidden md:inline">
              | Showing {data.length} row{data.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground mr-2">
              Page <strong>{currentPage}</strong> of{' '}
              <strong>{totalPages || 1}</strong>
            </span>
            <button
              onClick={() => {
                if (serverPagination) {
                  serverPagination.onPageChange(0);
                } else {
                  table.setPageIndex(0);
                }
              }}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center border border-input bg-card hover:bg-muted text-foreground disabled:opacity-50 rounded-md p-1.5 transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (serverPagination) {
                  serverPagination.onPageChange(serverPagination.pageIndex - 1);
                } else {
                  table.previousPage();
                }
              }}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center border border-input bg-card hover:bg-muted text-foreground disabled:opacity-50 rounded-md p-1.5 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (serverPagination) {
                  serverPagination.onPageChange(serverPagination.pageIndex + 1);
                } else {
                  table.nextPage();
                }
              }}
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex items-center justify-center border border-input bg-card hover:bg-muted text-foreground disabled:opacity-50 rounded-md p-1.5 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (serverPagination) {
                  serverPagination.onPageChange(totalPages - 1);
                } else {
                  table.setPageIndex(totalPages - 1);
                }
              }}
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex items-center justify-center border border-input bg-card hover:bg-muted text-foreground disabled:opacity-50 rounded-md p-1.5 transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
