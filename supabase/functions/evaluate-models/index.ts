import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  confusionMatrix: number[][];
}

interface FeatureImportance {
  feature: string;
  importance: number;
  description: string;
}

function calculateMetrics(
  predictions: boolean[],
  actualAnomalies: boolean[]
): EvaluationMetrics {
  let tp = 0, tn = 0, fp = 0, fn = 0;

  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] && actualAnomalies[i]) tp++;
    else if (!predictions[i] && !actualAnomalies[i]) tn++;
    else if (predictions[i] && !actualAnomalies[i]) fp++;
    else if (!predictions[i] && actualAnomalies[i]) fn++;
  }

  const accuracy = (tp + tn) / predictions.length;
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    truePositives: tp,
    trueNegatives: tn,
    falsePositives: fp,
    falseNegatives: fn,
    confusionMatrix: [
      [tn, fp],
      [fn, tp]
    ]
  };
}

function calculateFeatureImportance(
  tenders: any[],
  anomalyResults: any[]
): FeatureImportance[] {
  const anomalyTenderIds = new Set(
    anomalyResults.filter(r => r.is_anomaly).map(r => r.tender_id)
  );

  const anomalousTenders = tenders.filter(t => anomalyTenderIds.has(t.tender_id));
  const normalTenders = tenders.filter(t => !anomalyTenderIds.has(t.tender_id));

  const avgAnomalousDuration = anomalousTenders.reduce((sum, t) => sum + t.tender_duration_days, 0) / anomalousTenders.length || 0;
  const avgNormalDuration = normalTenders.reduce((sum, t) => sum + t.tender_duration_days, 0) / normalTenders.length || 0;
  const durationImportance = Math.abs(avgAnomalousDuration - avgNormalDuration) / avgNormalDuration;

  const avgAnomalousBidders = anomalousTenders.reduce((sum, t) => sum + t.number_of_bidders, 0) / anomalousTenders.length || 0;
  const avgNormalBidders = normalTenders.reduce((sum, t) => sum + t.number_of_bidders, 0) / normalTenders.length || 0;
  const biddersImportance = Math.abs(avgAnomalousBidders - avgNormalBidders) / avgNormalBidders;

  const anomalousOpenPct = anomalousTenders.filter(t => t.procurement_method === 'Open').length / anomalousTenders.length || 0;
  const normalOpenPct = normalTenders.filter(t => t.procurement_method === 'Open').length / normalTenders.length || 0;
  const methodImportance = Math.abs(anomalousOpenPct - normalOpenPct);

  const total = durationImportance + biddersImportance + methodImportance;

  return [
    {
      feature: 'tender_duration_days',
      importance: (durationImportance / total) * 100,
      description: `Avg anomalous: ${avgAnomalousDuration.toFixed(1)} days vs normal: ${avgNormalDuration.toFixed(1)} days`
    },
    {
      feature: 'number_of_bidders',
      importance: (biddersImportance / total) * 100,
      description: `Avg anomalous: ${avgAnomalousBidders.toFixed(1)} bidders vs normal: ${avgNormalBidders.toFixed(1)} bidders`
    },
    {
      feature: 'procurement_method',
      importance: (methodImportance / total) * 100,
      description: `Anomalous open: ${(anomalousOpenPct * 100).toFixed(1)}% vs normal: ${(normalOpenPct * 100).toFixed(1)}%`
    }
  ].sort((a, b) => b.importance - a.importance);
}

function calculateSHAPValues(
  tender: any,
  baselineAvg: any
): { feature: string; shapValue: number; contribution: string }[] {
  const durationDiff = (tender.tender_duration_days - baselineAvg.duration) / baselineAvg.duration;
  const biddersDiff = (tender.number_of_bidders - baselineAvg.bidders) / baselineAvg.bidders;
  const methodDiff = tender.procurement_method === 'Open' ? 0.1 : -0.1;

  return [
    {
      feature: 'tender_duration_days',
      shapValue: durationDiff,
      contribution: durationDiff < 0 ? 'Decreases anomaly score' : 'Increases anomaly score'
    },
    {
      feature: 'number_of_bidders',
      shapValue: biddersDiff,
      contribution: biddersDiff < 0 ? 'Increases anomaly score (fewer bidders)' : 'Decreases anomaly score'
    },
    {
      feature: 'procurement_method',
      shapValue: methodDiff,
      contribution: tender.procurement_method === 'Open' ? 'Neutral to positive' : 'Slightly negative'
    }
  ];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [tendersRes, auditRes] = await Promise.all([
      supabase.from('tenders').select('*'),
      supabase.from('audit_results').select('*')
    ]);

    const tenders = tendersRes.data || [];
    const auditResults = auditRes.data || [];

    if (tenders.length === 0 || auditResults.length === 0) {
      throw new Error('No data available for evaluation');
    }

    const processResults = auditResults.filter(r => r.model_type === 'process');
    const priceResults = auditResults.filter(r => r.model_type === 'price');
    const textResults = auditResults.filter(r => r.model_type === 'text');

    const actualAnomalies = tenders.map(t => {
      return t.tender_duration_days < 14 && t.number_of_bidders <= 2;
    });

    const processPredictions = processResults.map(r => r.is_anomaly);
    const processMetrics = calculateMetrics(processPredictions, actualAnomalies);

    const featureImportance = calculateFeatureImportance(tenders, processResults);

    const baselineAvg = {
      duration: tenders.reduce((sum, t) => sum + t.tender_duration_days, 0) / tenders.length,
      bidders: tenders.reduce((sum, t) => sum + t.number_of_bidders, 0) / tenders.length
    };

    const sampleTender = tenders.find(t => 
      processResults.find(r => r.tender_id === t.tender_id && r.is_anomaly)
    );

    const shapValues = sampleTender ? calculateSHAPValues(sampleTender, baselineAvg) : [];

    const priceAnomalyCount = priceResults.filter(r => r.is_anomaly).length;
    const textAnomalyCount = textResults.filter(r => r.is_anomaly).length;

    const coverageMetrics = {
      totalTenders: tenders.length,
      processAnomalies: processResults.filter(r => r.is_anomaly).length,
      priceAnomalies: priceAnomalyCount,
      textAnomalies: textAnomalyCount,
      overallCoverage: {
        flaggedByAnyModel: new Set(
          auditResults.filter(r => r.is_anomaly).map(r => r.tender_id)
        ).size,
        flaggedByAllModels: tenders.filter(t => {
          const hasProcess = processResults.find(r => r.tender_id === t.tender_id && r.is_anomaly);
          const hasPrice = priceResults.find(r => r.tender_id === t.tender_id && r.is_anomaly);
          const hasText = textResults.find(r => r.tender_id === t.tender_id && r.is_anomaly);
          return hasProcess && (hasPrice || hasText);
        }).length
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        evaluation: {
          processModel: {
            name: 'Isolation Forest (Process Anomaly Detector)',
            metrics: processMetrics,
            featureImportance: featureImportance,
            description: 'Detects procedural irregularities in procurement processes'
          },
          priceModel: {
            name: 'Z-Score Analysis (Price Anomaly Detector)',
            anomaliesDetected: priceAnomalyCount,
            description: 'Identifies price outliers using statistical analysis against market data'
          },
          textModel: {
            name: 'NLP (Text & Collusion Detector)',
            anomaliesDetected: textAnomalyCount,
            description: 'Detects brand bias and collusion using TF-IDF and cosine similarity'
          },
          shapAnalysis: {
            sampleTenderId: sampleTender?.tender_id,
            values: shapValues,
            description: 'SHAP-like values showing feature contributions to anomaly prediction'
          },
          coverageMetrics: coverageMetrics
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});