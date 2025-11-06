import { useEffect, useState } from 'react';
import { getTenders, getAuditResults, Tender, AuditResult } from '../lib/database';
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react';

interface TenderListProps {
  onSelectTender: (tender: Tender) => void;
}

export function TenderList({ onSelectTender }: TenderListProps) {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'flagged'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tendersData, auditResultsData] = await Promise.all([
        getTenders(),
        getAuditResults()
      ]);

      setTenders(tendersData);
      setAuditResults(auditResultsData);
    } finally {
      setLoading(false);
    }
  }

  function getTenderAnomalies(tenderId: string) {
    return auditResults.filter(r => r.tender_id === tenderId && r.is_anomaly);
  }

  const displayedTenders = filterType === 'flagged'
    ? tenders.filter(t => getTenderAnomalies(t.tender_id).length > 0)
    : tenders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading tenders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {filterType === 'all' ? 'All Tenders' : 'Flagged Tenders'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({tenders.length})
          </button>
          <button
            onClick={() => setFilterType('flagged')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'flagged'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Flagged ({tenders.filter(t => getTenderAnomalies(t.tender_id).length > 0).length})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {displayedTenders.map((tender) => {
          const anomalies = getTenderAnomalies(tender.tender_id);
          const isFlagged = anomalies.length > 0;

          return (
            <div
              key={tender.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                isFlagged ? 'border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {tender.tender_id}
                    </span>
                    {isFlagged ? (
                      <span className="flex items-center gap-1 text-sm font-semibold text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        {anomalies.length} {anomalies.length === 1 ? 'Flag' : 'Flags'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Clear
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {tender.tender_title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tender.procuring_entity}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {tender.category}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      {tender.procurement_method}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      {tender.tender_duration_days} days
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      {tender.number_of_bidders} bidders
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectTender(tender)}
                  className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {displayedTenders.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No {filterType === 'flagged' ? 'flagged ' : ''}tenders found</p>
        </div>
      )}
    </div>
  );
}
