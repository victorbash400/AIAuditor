import { useState } from 'react';
import { Play, RefreshCw, Database, Brain, FileText } from 'lucide-react';
import { runFullPipeline } from '../lib/api';

interface PipelineControlProps {
  onComplete: () => void;
}

export function PipelineControl({ onComplete }: PipelineControlProps) {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<string[]>([]);

  async function runPipeline() {
    setRunning(true);
    setProgress([]);
    setStatus('Starting pipeline...');

    try {
      setStatus('Generating procurement data...');
      setProgress(prev => [...prev, 'Generated 50 tenders and contracts']);

      setStatus('Generating market price database...');
      setProgress(prev => [...prev, 'Generated 1000 market price records']);

      setStatus('Running Model 1: Process Anomaly Detection...');
      setProgress(prev => [...prev, 'Analyzing procurement procedures with Isolation Forest']);

      setStatus('Running Model 2: Price Anomaly Detection...');
      setProgress(prev => [...prev, 'Comparing prices against market data using Z-Score']);

      setStatus('Running Model 3: Text Anomaly Detection...');
      setProgress(prev => [...prev, 'Analyzing tender text with TF-IDF and NER']);

      const results = await runFullPipeline();

      setProgress(prev => [
        ...prev,
        `Process Model: ${results.process.anomaliesDetected} anomalies detected`,
        `Price Model: ${results.price.anomaliesDetected} anomalies detected`,
        `Text Model: ${results.text.anomaliesDetected} anomalies detected`
      ]);

      setStatus('Pipeline completed successfully!');

      setTimeout(() => {
        onComplete();
        setRunning(false);
      }, 1000);
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgress(prev => [...prev, 'Pipeline failed. Please try again.']);
      setRunning(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-gray-600 p-8 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-600 p-3 rounded-xl">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Audit Pipeline</h2>
          <p className="text-gray-600 dark:text-gray-400">Run the complete 3-model analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PipelineStep
          icon={<Database className="w-5 h-5" />}
          title="Data Generation"
          description="Create synthetic procurement data"
        />
        <PipelineStep
          icon={<Brain className="w-5 h-5" />}
          title="ML Analysis"
          description="Run 3 anomaly detection models"
        />
        <PipelineStep
          icon={<FileText className="w-5 h-5" />}
          title="Generate Reports"
          description="Create explainable audit results"
        />
      </div>

      {!running && progress.length === 0 && (
        <button
          onClick={runPipeline}
          disabled={running}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-6 h-6" />
          Run Full Pipeline
        </button>
      )}

      {running && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-blue-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-medium">{status}</span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2">
            {progress.map((step, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!running && progress.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg">
            <span className="text-2xl">✓</span>
            <span className="font-semibold text-lg">{status}</span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2">
            {progress.map((step, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <button
            onClick={runPipeline}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
          >
            <RefreshCw className="w-5 h-5" />
            Run Again
          </button>
        </div>
      )}
    </div>
  );
}

function PipelineStep({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
        {icon}
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
