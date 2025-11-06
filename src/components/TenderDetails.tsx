import { useEffect, useState } from 'react';
import { getContracts, getAuditResults, Tender, Contract, AuditResult } from '../lib/database';
import { X, AlertTriangle, CheckCircle, DollarSign, FileText, Filter } from 'lucide-react';

interface TenderDetailsProps {
  tender: Tender;
  onClose: () => void;
}

export function TenderDetails({ tender, onClose }: TenderDetailsProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tender.tender_id]);

  async function loadData() {
    try {
      const [contractsData, auditResultsData] = await Promise.all([
        getContracts(),
        getAuditResults()
      ]);

      setContracts(contractsData.filter(c => c.tender_id === tender.tender_id));
      setAuditResults(auditResultsData.filter(a => a.tender_id === tender.tender_id));
    } finally {
      setLoading(false);
    }
  }

  const processAnomalies = auditResults.filter(r => r.model_type === 'process');
  const priceAnomalies = auditResults.filter(r => r.model_type === 'price');
  const textAnomalies = auditResults.filter(r => r.model_type === 'text');

  const totalValue = contracts.reduce((sum, c) => sum + c.total_value, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                {tender.tender_id}
              </span>
              {auditResults.some(r => r.is_anomaly) && (
                <span className="flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded">
                  <AlertTriangle className="w-4 h-4" />
                  Flagged
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tender.tender_title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{tender.procuring_entity}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard label="Category" value={tender.category} />
            <InfoCard label="Method" value={tender.procurement_method} />
            <InfoCard label="Duration" value={`${tender.tender_duration_days} days`} />
            <InfoCard label="Bidders" value={tender.number_of_bidders.toString()} />
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{tender.tender_description}</p>
          </div>

          {tender.technical_specs && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Technical Specifications</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {tender.technical_specs}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Audit Results</h3>

            <AnomalySection
              title="Process Risk Analysis"
              icon={<Filter className="w-5 h-5" />}
              color="red"
              anomalies={processAnomalies}
            />

            <AnomalySection
              title="Text Risk Analysis"
              icon={<FileText className="w-5 h-5" />}
              color="purple"
              anomalies={textAnomalies}
            />
          </div>

          {contracts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contracts & Price Analysis</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    KES {totalValue.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {contracts.map((contract) => {
                  const priceResult = priceAnomalies.find(
                    r => r.contract_id === contract.contract_id
                  );

                  return (
                    <div
                      key={contract.id}
                      className={`rounded-xl border-2 p-5 ${
                        priceResult?.is_anomaly
                          ? 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {contract.contract_id}
                            </span>
                            {priceResult?.is_anomaly && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                                <DollarSign className="w-3 h-3" />
                                Price Anomaly
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {contract.item_description}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{contract.supplier_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Unit Price</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            KES {contract.unit_price.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Qty: {contract.quantity} | Total: KES {contract.total_value.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {priceResult && (
                        <div
                          className={`mt-3 p-4 rounded-lg ${
                            priceResult.is_anomaly ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-900'
                          }`}
                        >
                          <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed">
                            {priceResult.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function AnomalySection({
  title,
  icon,
  color,
  anomalies
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  anomalies: AuditResult[];
}) {
  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      icon: 'text-red-600',
      alert: 'bg-red-100'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-600',
      icon: 'text-amber-600',
      alert: 'bg-amber-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      icon: 'text-purple-600',
      alert: 'bg-purple-100'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses];
  const hasAnomaly = anomalies.some(a => a.is_anomaly);

  return (
    <div className={`rounded-xl border-2 p-5 ${colors.bg} ${colors.border} dark:bg-gray-800/50 dark:border-gray-600`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={colors.icon}>{icon}</div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        {hasAnomaly ? (
          <span className={`ml-auto flex items-center gap-1 text-sm font-semibold ${colors.text}`}>
            <AlertTriangle className="w-4 h-4" />
            Issue Detected
          </span>
        ) : (
          <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-green-600">
            <CheckCircle className="w-4 h-4" />
            Clear
          </span>
        )}
      </div>

      {anomalies.map((result) => (
        <div
          key={result.id}
          className={`p-4 rounded-lg ${result.is_anomaly ? colors.alert : 'bg-white dark:bg-gray-900'}`}
        >
          <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed">{result.explanation}</p>
        </div>
      ))}
    </div>
  );
}
