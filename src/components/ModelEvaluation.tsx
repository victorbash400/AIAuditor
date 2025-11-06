import { useState } from 'react';
import { evaluateModels } from '../lib/api';
import { BarChart, Target, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export function ModelEvaluation() {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  async function runEvaluation() {
    setLoading(true);
    try {
      const result = await evaluateModels();
      if (result.success) {
        setEvaluation(result.evaluation);
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Evaluation</h2>
          <p className="text-gray-600 mt-1">
            Assess model performance with accuracy metrics and feature importance
          </p>
        </div>
        <button
          onClick={runEvaluation}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
        >
          <Target className="w-5 h-5" />
          {loading ? 'Evaluating...' : 'Run Evaluation'}
        </button>
      </div>

      {!evaluation && !loading && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
          <BarChart className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Evaluation Results Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Click "Run Evaluation" to assess model performance with accuracy, precision, recall, and SHAP-like feature importance analysis.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Running evaluation...</div>
        </div>
      )}

      {evaluation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ModelCard
              title={evaluation.processModel.name}
              description={evaluation.processModel.description}
              metrics={evaluation.processModel.metrics}
              color="red"
            />
            <InfoCard
              title={evaluation.priceModel.name}
              description={evaluation.priceModel.description}
              value={`${evaluation.priceModel.anomaliesDetected} anomalies`}
              color="amber"
            />
            <InfoCard
              title={evaluation.textModel.name}
              description={evaluation.textModel.description}
              value={`${evaluation.textModel.anomaliesDetected} anomalies`}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Feature Importance (Process Model)
              </h3>
              <div className="space-y-4">
                {evaluation.processModel.featureImportance.map((feature: any, index: number) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {feature.feature}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {feature.importance.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${feature.importance}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {evaluation.shapAnalysis.values.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  SHAP-like Analysis
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Feature contributions for tender: {evaluation.shapAnalysis.sampleTenderId}
                </p>
                <div className="space-y-4">
                  {evaluation.shapAnalysis.values.map((shap: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-600 pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {shap.feature}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            shap.shapValue > 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {shap.shapValue > 0 ? '+' : ''}
                          {shap.shapValue.toFixed(3)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {shap.contribution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Coverage Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricBox
                label="Total Tenders"
                value={evaluation.coverageMetrics.totalTenders}
                icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
              />
              <MetricBox
                label="Process Flags"
                value={evaluation.coverageMetrics.processAnomalies}
                icon={<AlertCircle className="w-5 h-5 text-red-600" />}
              />
              <MetricBox
                label="Price Flags"
                value={evaluation.coverageMetrics.priceAnomalies}
                icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
              />
              <MetricBox
                label="Text Flags"
                value={evaluation.coverageMetrics.textAnomalies}
                icon={<AlertCircle className="w-5 h-5 text-purple-600" />}
              />
              <MetricBox
                label="Any Model"
                value={evaluation.coverageMetrics.overallCoverage.flaggedByAnyModel}
                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelCard({ title, description, metrics, color }: any) {
  const colorClasses = {
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-700 mb-4">{description}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-600">Accuracy</p>
          <p className="text-lg font-bold text-gray-900">
            {(metrics.accuracy * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-600">Precision</p>
          <p className="text-lg font-bold text-gray-900">
            {(metrics.precision * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-600">Recall</p>
          <p className="text-lg font-bold text-gray-900">
            {(metrics.recall * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-600">F1 Score</p>
          <p className="text-lg font-bold text-gray-900">
            {(metrics.f1Score * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg">
        <p className="text-xs text-gray-600 mb-2">Confusion Matrix</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-green-100 rounded">
            <div className="font-bold text-gray-900">TN: {metrics.trueNegatives}</div>
          </div>
          <div className="text-center p-2 bg-red-100 rounded">
            <div className="font-bold text-gray-900">FP: {metrics.falsePositives}</div>
          </div>
          <div className="text-center p-2 bg-red-100 rounded">
            <div className="font-bold text-gray-900">FN: {metrics.falseNegatives}</div>
          </div>
          <div className="text-center p-2 bg-green-100 rounded">
            <div className="font-bold text-gray-900">TP: {metrics.truePositives}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, description, value, color }: any) {
  const colorClasses = {
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-700 mb-4">{description}</p>
      <div className="bg-white rounded-lg p-4 text-center">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function MetricBox({ label, value, icon }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-gray-600">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
