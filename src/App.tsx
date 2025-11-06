import { useState, useEffect } from 'react';
import { Shield, BarChart3, FileText, Play, Moon, Sun, Target, Upload } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TenderList } from './components/TenderList';
import { TenderDetails } from './components/TenderDetails';
import { PipelineControl } from './components/PipelineControl';
import { ModelEvaluation } from './components/ModelEvaluation';
import { DataUpload } from './components/DataUpload';
import { Tender } from './lib/supabase';

type View = 'pipeline' | 'dashboard' | 'tenders' | 'evaluation' | 'upload';

function App() {
  const [currentView, setCurrentView] = useState<View>('pipeline');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  function handlePipelineComplete() {
    setRefreshKey(prev => prev + 1);
    setCurrentView('dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  The AI Auditor
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  360° Explainable AI for Public Procurement Auditing
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <NavButton
                active={currentView === 'pipeline'}
                onClick={() => setCurrentView('pipeline')}
                icon={<Play className="w-4 h-4" />}
                label="Pipeline"
              />
              <NavButton
                active={currentView === 'dashboard'}
                onClick={() => setCurrentView('dashboard')}
                icon={<BarChart3 className="w-4 h-4" />}
                label="Dashboard"
              />
              <NavButton
                active={currentView === 'tenders'}
                onClick={() => setCurrentView('tenders')}
                icon={<FileText className="w-4 h-4" />}
                label="Tenders"
              />
              <NavButton
                active={currentView === 'evaluation'}
                onClick={() => setCurrentView('evaluation')}
                icon={<Target className="w-4 h-4" />}
                label="Evaluation"
              />
              <NavButton
                active={currentView === 'upload'}
                onClick={() => setCurrentView('upload')}
                icon={<Upload className="w-4 h-4" />}
                label="Upload"
              />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'pipeline' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to The AI Auditor
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                This system uses three specialized AI models to detect anomalies in public procurement:
                Process Risk (Isolation Forest), Price Risk (Z-Score Analysis), and Text Risk (NLP).
                Run the pipeline to generate data and analyze it.
              </p>
            </div>
            <PipelineControl onComplete={handlePipelineComplete} />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <ModelCard
                title="Model 1: Process Risk"
                description="Detects procedural irregularities using Isolation Forest algorithm"
                features={[
                  'Analyzes tender duration',
                  'Evaluates bidder participation',
                  'Identifies suspicious patterns'
                ]}
                color="red"
              />
              <ModelCard
                title="Model 2: Price Risk"
                description="Identifies price anomalies using statistical Z-Score analysis"
                features={[
                  'Compares to market prices',
                  'Calculates price deviations',
                  'Quantifies overspending'
                ]}
                color="amber"
              />
              <ModelCard
                title="Model 3: Text Risk"
                description="Detects bias and collusion using NLP techniques"
                features={[
                  'TF-IDF similarity analysis',
                  'Brand bias detection',
                  'Collusion identification'
                ]}
                color="purple"
              />
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div key={refreshKey}>
            <Dashboard />
          </div>
        )}

        {currentView === 'tenders' && (
          <div key={refreshKey}>
            <TenderList onSelectTender={setSelectedTender} />
          </div>
        )}

        {currentView === 'evaluation' && (
          <div key={refreshKey}>
            <ModelEvaluation />
          </div>
        )}

        {currentView === 'upload' && <DataUpload />}

        {selectedTender && (
          <TenderDetails
            tender={selectedTender}
            onClose={() => setSelectedTender(null)}
          />
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="font-semibold">AI for Good Governance</p>
            <p className="text-sm mt-1">
              Explainable AI solution for transparent and accountable public procurement
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ModelCard({ title, description, features, color }: {
  title: string;
  description: string;
  features: string[];
  color: string;
}) {
  const colorClasses = {
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]} dark:bg-gray-800/50 dark:border-gray-600`}>
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
