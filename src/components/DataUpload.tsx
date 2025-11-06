import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { importData } from '../lib/api';

export function DataUpload() {
  const [dataType, setDataType] = useState<'tenders' | 'contracts' | 'market_prices'>('tenders');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [clearExisting, setClearExisting] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const content = await file.text();
      const response = await importData(dataType, content, clearExisting);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  }

  function downloadTemplate() {
    let csvContent = '';

    if (dataType === 'tenders') {
      csvContent = 'tender_id,procuring_entity,tender_title,category,procurement_method,tender_duration_days,number_of_bidders,tender_description,technical_specs\n';
      csvContent += 'TND-2024-00001,Ministry of Health,Procurement of Medical Equipment,Medical Supplies,Open,30,5,Supply and delivery of medical equipment,High quality medical grade equipment\n';
    } else if (dataType === 'contracts') {
      csvContent = 'contract_id,tender_id,supplier_name,item_description,unit_price,quantity\n';
      csvContent += 'CNT-2024-00001,TND-2024-00001,ABC Suppliers Ltd,Laptop,65000,10\n';
    } else if (dataType === 'market_prices') {
      csvContent = 'item_name,category,unit_price,source\n';
      csvContent += 'Laptop,IT Equipment,65000,Jumia Kenya\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Your Data</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Import your own procurement data in CSV format
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Type
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="tenders">Tenders</option>
              <option value="contracts">Contracts</option>
              <option value="market_prices">Market Prices</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Clear existing data before import
            </label>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700"
            >
              Click to select a CSV file
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">or drag and drop</p>
            {file && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <FileText className="w-4 h-4" />
                {file.name}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download Template
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              {loading ? 'Uploading...' : 'Upload Data'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-xl p-6 ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3
                className={`font-semibold mb-2 ${
                  result.success
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}
              >
                {result.success ? 'Upload Successful' : 'Upload Failed'}
              </h3>
              <p
                className={`text-sm ${
                  result.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}
              >
                {result.message || result.error}
              </p>
              {result.imported && (
                <div className="mt-3 text-sm space-y-1">
                  <p className="text-green-800 dark:text-green-200">
                    ✓ Imported: {result.imported} records
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-amber-800 dark:text-amber-200">
                      ⚠ Skipped: {result.skipped} records (validation errors)
                    </p>
                  )}
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1">
                    Validation Errors:
                  </p>
                  {result.errors.slice(0, 10).map((error: string, index: number) => (
                    <p key={index} className="text-xs text-red-700 dark:text-red-300">
                      • {error}
                    </p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      ...and {result.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">CSV Format Requirements</h3>

        {dataType === 'tenders' && (
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium">Required columns:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>tender_id (unique identifier)</li>
              <li>procuring_entity (organization name)</li>
              <li>tender_title (descriptive title)</li>
              <li>category (e.g., IT Equipment, Medical Supplies)</li>
              <li>procurement_method (Open or Restricted)</li>
              <li>tender_duration_days (positive number)</li>
              <li>number_of_bidders (non-negative number)</li>
              <li>tender_description (detailed description)</li>
              <li>technical_specs (optional)</li>
            </ul>
          </div>
        )}

        {dataType === 'contracts' && (
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium">Required columns:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>contract_id (unique identifier)</li>
              <li>tender_id (must match existing tender)</li>
              <li>supplier_name (company name)</li>
              <li>item_description (item name)</li>
              <li>unit_price (positive number)</li>
              <li>quantity (positive number)</li>
            </ul>
          </div>
        )}

        {dataType === 'market_prices' && (
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium">Required columns:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>item_name (product name)</li>
              <li>category (e.g., IT Equipment)</li>
              <li>unit_price (positive number)</li>
              <li>source (e.g., Jumia Kenya)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
