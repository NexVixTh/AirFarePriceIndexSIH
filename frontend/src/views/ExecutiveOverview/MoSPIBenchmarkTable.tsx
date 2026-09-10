import React from 'react';
import { DataTable, type ColumnDef } from '../../components/common/DataTable';
import type { CPITransportResponse, CPIItem } from '../../api/types';

interface MoSPIBenchmarkTableProps {
  cpiData: CPITransportResponse | null;
  loading: boolean;
}

export const MoSPIBenchmarkTable: React.FC<MoSPIBenchmarkTableProps> = ({
  cpiData,
  loading,
}) => {
  const cpiColumns: ColumnDef<CPIItem>[] = [
    {
      id: 'period',
      header: 'Observation Period',
      sortKey: 'period',
      accessor: (row) => <span className="font-bold text-white">{row.period}</span>,
      width: '25%',
    },
    {
      id: 'sub_group',
      header: 'Sub-Group',
      accessor: (row) => <span className="text-slate-300">{row.sub_group}</span>,
      width: '30%',
    },
    {
      id: 'index_value',
      header: 'CPI Value (2012=100)',
      sortKey: 'index_value',
      align: 'right',
      accessor: (row) => (
        <span className="font-bold font-mono text-cyan-400 tabular-nums">
          {row.index_value !== null ? row.index_value.toFixed(1) : 'N/A'}
        </span>
      ),
      width: '25%',
    },
    {
      id: 'source',
      header: 'Reporting Authority',
      accessor: (row) => (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101B39] text-cyan-300 border border-cyan-500/30">
          {row.source || 'MoSPI eSankhyiki'}
        </span>
      ),
      width: '20%',
    },
  ];

  return (
    <DataTable
      title="MoSPI Official CPI Transport Reference Time-Series"
      subtitle="Historical macroeconomic benchmark observations synchronized directly from the Ministry of Statistics and Programme Implementation"
      data={cpiData?.data || []}
      columns={cpiColumns}
      loading={loading}
      searchPlaceholder="Filter observations by period (e.g. 2024, Jan)..."
      searchFilter={(item, q) =>
        item.period.toLowerCase().includes(q) ||
        item.sub_group.toLowerCase().includes(q)
      }
      pageSize={5}
      emptyTitle="Awaiting MoSPI Data Sync"
      emptyDescription="Run `python -m pipeline.cpi_reference` to synchronize official CPI series."
    />
  );
};
