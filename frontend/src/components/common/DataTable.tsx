import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Download 
} from 'lucide-react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortKey?: keyof T;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onExportCSV?: () => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  title,
  subtitle,
  searchPlaceholder = 'Search records...',
  searchFilter,
  pageSize = 10,
  loading = false,
  emptyTitle,
  emptyDescription,
  onExportCSV,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchQuery.trim().toLowerCase()));
  }, [data, searchQuery, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortCol, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortCol === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className={`cmd-panel p-4 sm:p-5 space-y-3.5 ${className}`}>
      {/* Table Header: Title + Search & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#1B2A4A]">
        <div>
          {title && (
            <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{title}</span>
            </h3>
          )}
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-2">
          {searchFilter && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="bg-[#101B39] border border-[#1B2A4A] rounded pl-8 pr-3 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono w-48 sm:w-56 transition-colors"
              />
            </div>
          )}

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              title="Export Table as CSV"
              className="p-1.5 rounded bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] text-slate-300 hover:text-white shadow-soft transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto rounded border border-[#1B2A4A]">
        <table className="w-full text-left text-xs text-slate-200 border-collapse">
          <thead>
            <tr className="border-b border-[#1B2A4A] bg-[#101B39] text-slate-300 text-[10px] font-mono uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.id}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col.sortKey)}
                  className={`p-2.5 font-bold ${
                    col.sortKey ? 'cursor-pointer select-none hover:text-white' : ''
                  } ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  <div
                    className={`inline-flex items-center space-x-1 ${
                      col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortKey && sortCol === col.sortKey && (
                      <span className="text-blue-400">
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="w-3 h-3 inline" />
                        ) : (
                          <ChevronDown className="w-3 h-3 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1B2A4A]/60 bg-[#0B132B]">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={columns.length} className="p-2.5">
                    <LoadingSkeleton className="h-6 w-full rounded bg-[#101B39]" />
                  </td>
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6">
                  <EmptyState
                    title={emptyTitle || 'No Records Found'}
                    description={emptyDescription || 'No data matches the selected criteria.'}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-[#122044] transition-colors font-mono text-[11px]"
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`p-2.5 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.accessor
                        ? col.accessor(row)
                        : (row as Record<string, unknown>)[col.id] !== undefined
                        ? String((row as Record<string, unknown>)[col.id])
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1.5 text-[11px] font-mono text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} observations
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
            </button>
            <span className="px-2 text-white font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-[#101B39] hover:bg-[#142247] border border-[#1B2A4A] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
