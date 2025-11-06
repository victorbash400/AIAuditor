import { useEffect, useState } from 'react';
import { getTenders, getContracts, getAuditResults, Tender, Contract, AuditResult } from '../lib/database';
import { AlertTriangle, CheckCircle, TrendingUp, FileText, DollarSign, Filter, Network } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Sankey, Rectangle } from 'recharts';

export function Dashboard() {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [auditResultsData, tendersData, contractsData] = await Promise.all([
        getAuditResults(),
        getTenders(),
        getContracts()
      ]);

      setAuditResults(auditResultsData);
      setTenders(tendersData);
      setContracts(contractsData);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const totalTenders = tenders.length;
  const totalContracts = contracts.length;
  const totalValue = contracts.reduce((sum, c) => sum + c.total_value, 0);

  const anomalousTenders = new Set(
    auditResults.filter(r => r.is_anomaly).map(r => r.tender_id)
  ).size;

  const processAnomalies = auditResults.filter(r => r.model_type === 'process' && r.is_anomaly).length;
  const priceAnomalies = auditResults.filter(r => r.model_type === 'price' && r.is_anomaly).length;
  const textAnomalies = auditResults.filter(r => r.model_type === 'text' && r.is_anomaly).length;

  const modelData = [
    { name: 'Process Risk', value: processAnomalies, color: '#ef4444' },
    { name: 'Price Risk', value: priceAnomalies, color: '#f59e0b' },
    { name: 'Text Risk', value: textAnomalies, color: '#8b5cf6' },
  ];

  const categoryData = tenders.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const riskDistribution = [
    { category: 'Process Risk', value: processAnomalies, fullMark: Math.max(processAnomalies, priceAnomalies, textAnomalies) },
    { category: 'Price Risk', value: priceAnomalies, fullMark: Math.max(processAnomalies, priceAnomalies, textAnomalies) },
    { category: 'Text Risk', value: textAnomalies, fullMark: Math.max(processAnomalies, priceAnomalies, textAnomalies) },
  ];

  const entityRiskData = tenders.reduce((acc, tender) => {
    const hasAnomalies = auditResults.some(r => r.tender_id === tender.tender_id && r.is_anomaly);
    if (hasAnomalies) {
      acc[tender.procuring_entity] = (acc[tender.procuring_entity] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topRiskyEntities = Object.entries(entityRiskData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tenders"
          value={totalTenders.toLocaleString()}
          icon={<FileText className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Flagged Tenders"
          value={anomalousTenders.toLocaleString()}
          subtitle={`${totalTenders > 0 ? ((anomalousTenders / totalTenders) * 100).toFixed(1) : 0}% of total`}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          bgColor="bg-red-50"
        />
        <StatCard
          title="Total Contracts"
          value={totalContracts.toLocaleString()}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          bgColor="bg-green-50"
        />
        <StatCard
          title="Total Value"
          value={`KES ${(totalValue / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="w-6 h-6 text-amber-600" />}
          bgColor="bg-amber-50"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Tenders by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Distribution Web</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={riskDistribution}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
              <Radar name="Anomalies" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Multi-dimensional risk assessment across detection models
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Risky Entities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topRiskyEntities} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Entities with highest number of flagged tenders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RiskCard
          title="Process Risk"
          count={processAnomalies}
          description="Procedural irregularities detected"
          icon={<Filter className="w-5 h-5 text-red-600" />}
          color="red"
        />
        <RiskCard
          title="Price Risk"
          count={priceAnomalies}
          description="Price anomalies identified"
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <RiskCard
          title="Text Risk"
          count={textAnomalies}
          description="Biased or collusive language"
          icon={<FileText className="w-5 h-5 text-purple-600" />}
          color="purple"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, bgColor }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function RiskCard({ title, count, description, icon, color }: {
  title: string;
  count: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]} dark:bg-gray-800/50 transition-colors`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{count}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
