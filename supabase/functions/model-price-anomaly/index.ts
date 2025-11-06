import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Contract {
  contract_id: string;
  tender_id: string;
  item_description: string;
  unit_price: number;
  quantity: number;
  total_value: number;
}

interface MarketPrice {
  item_name: string;
  unit_price: number;
}

interface MarketStats {
  mean: number;
  stdDev: number;
  count: number;
  min: number;
  max: number;
}

function calculateStats(prices: number[]): MarketStats {
  if (prices.length === 0) {
    return { mean: 0, stdDev: 0, count: 0, min: 0, max: 0 };
  }

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    stdDev,
    count: prices.length,
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`;
}

function generateExplanation(
  contract: Contract,
  zScore: number,
  stats: MarketStats,
  isAnomaly: boolean
): string {
  if (!isAnomaly) {
    return `Price is within normal market range (Z-score: ${zScore.toFixed(2)}). Unit price ${formatCurrency(contract.unit_price)} is close to market average of ${formatCurrency(Math.round(stats.mean))}.`;
  }

  const priceDiff = contract.unit_price - stats.mean;
  const percentDiff = (priceDiff / stats.mean * 100).toFixed(1);
  const stdDevs = Math.abs(zScore).toFixed(1);

  if (zScore > 0) {
    return `PRICE ANOMALY DETECTED (Z-score: ${zScore.toFixed(2)}): Item "${contract.item_description}" was procured at ${formatCurrency(contract.unit_price)} per unit, which is ${stdDevs} standard deviations ABOVE the market average of ${formatCurrency(Math.round(stats.mean))} (based on ${stats.count} market data points). This represents a ${percentDiff}% overpayment (${formatCurrency(Math.round(priceDiff))} per unit). Potential overspend: ${formatCurrency(Math.round(priceDiff * contract.quantity))}.`;
  } else {
    return `PRICE ANOMALY DETECTED (Z-score: ${zScore.toFixed(2)}): Item "${contract.item_description}" was procured at ${formatCurrency(contract.unit_price)} per unit, which is ${stdDevs} standard deviations BELOW the market average of ${formatCurrency(Math.round(stats.mean))} (based on ${stats.count} market data points). This unusually low price (${percentDiff}% below market) may indicate quality concerns or data errors.`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*');

    if (contractsError) throw contractsError;
    if (!contracts || contracts.length === 0) {
      throw new Error('No contract data found. Please generate data first.');
    }

    const { data: marketPrices, error: marketError } = await supabase
      .from('market_prices')
      .select('*');

    if (marketError) throw marketError;
    if (!marketPrices || marketPrices.length === 0) {
      throw new Error('No market price data found. Please generate market data first.');
    }

    const marketStatsByItem = new Map<string, MarketStats>();
    const pricesByItem = new Map<string, number[]>();

    for (const mp of marketPrices) {
      if (!pricesByItem.has(mp.item_name)) {
        pricesByItem.set(mp.item_name, []);
      }
      pricesByItem.get(mp.item_name)!.push(mp.unit_price);
    }

    for (const [itemName, prices] of pricesByItem.entries()) {
      marketStatsByItem.set(itemName, calculateStats(prices));
    }

    const results = [];
    let anomalyCount = 0;
    let totalOverspend = 0;

    for (const contract of contracts) {
      const stats = marketStatsByItem.get(contract.item_description);

      if (!stats || stats.count === 0) {
        results.push({
          contract_id: contract.contract_id,
          tender_id: contract.tender_id,
          model_type: 'price',
          is_anomaly: false,
          anomaly_score: 0,
          explanation: `No market data available for "${contract.item_description}" to perform price comparison.`
        });
        continue;
      }

      const zScore = calculateZScore(contract.unit_price, stats.mean, stats.stdDev);
      const isAnomaly = Math.abs(zScore) > 2.5;

      if (isAnomaly) {
        anomalyCount++;
        if (zScore > 0) {
          const overspend = (contract.unit_price - stats.mean) * contract.quantity;
          totalOverspend += overspend;
        }
      }

      results.push({
        contract_id: contract.contract_id,
        tender_id: contract.tender_id,
        model_type: 'price',
        is_anomaly: isAnomaly,
        anomaly_score: zScore,
        explanation: generateExplanation(contract, zScore, stats, isAnomaly)
      });
    }

    await supabase.from('audit_results').delete().eq('model_type', 'price');

    const { error: insertError } = await supabase.from('audit_results').insert(results);
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Price anomaly detection completed',
        totalContracts: contracts.length,
        anomaliesDetected: anomalyCount,
        anomalyRate: (anomalyCount / contracts.length * 100).toFixed(2) + '%',
        estimatedOverspend: formatCurrency(Math.round(totalOverspend))
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