import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Tender {
  tender_id: string;
  procuring_entity: string;
  tender_title: string;
  procurement_method: string;
  tender_duration_days: number;
  number_of_bidders: number;
}

class IsolationTree {
  private splitAttr: string | null = null;
  private splitValue: number | null = null;
  private left: IsolationTree | null = null;
  private right: IsolationTree | null = null;
  private size: number = 0;

  fit(data: number[][], attrs: string[], depth: number, maxDepth: number) {
    this.size = data.length;
    
    if (depth >= maxDepth || data.length <= 1) {
      return;
    }

    const attrIdx = Math.floor(Math.random() * attrs.length);
    this.splitAttr = attrs[attrIdx];
    
    const values = data.map(row => row[attrIdx]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    
    if (minVal === maxVal) return;
    
    this.splitValue = minVal + Math.random() * (maxVal - minVal);
    
    const leftData = data.filter(row => row[attrIdx] < this.splitValue!);
    const rightData = data.filter(row => row[attrIdx] >= this.splitValue!);
    
    if (leftData.length > 0) {
      this.left = new IsolationTree();
      this.left.fit(leftData, attrs, depth + 1, maxDepth);
    }
    
    if (rightData.length > 0) {
      this.right = new IsolationTree();
      this.right.fit(rightData, attrs, depth + 1, maxDepth);
    }
  }

  pathLength(point: number[], depth: number): number {
    if (this.splitAttr === null || this.splitValue === null) {
      return depth + this.c(this.size);
    }
    
    const attrIdx = ['tender_duration_days', 'number_of_bidders', 'method_encoded'].indexOf(this.splitAttr);
    const value = point[attrIdx];
    
    if (value < this.splitValue) {
      return this.left ? this.left.pathLength(point, depth + 1) : depth + 1;
    } else {
      return this.right ? this.right.pathLength(point, depth + 1) : depth + 1;
    }
  }

  private c(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }
}

class IsolationForest {
  private trees: IsolationTree[] = [];
  private nTrees: number;
  private maxDepth: number;
  private avgPathLength: number = 0;

  constructor(nTrees: number = 100) {
    this.nTrees = nTrees;
    this.maxDepth = 8;
  }

  fit(data: number[][], attrs: string[]) {
    const sampleSize = Math.min(256, data.length);
    this.maxDepth = Math.ceil(Math.log2(sampleSize));
    
    for (let i = 0; i < this.nTrees; i++) {
      const sample = [];
      for (let j = 0; j < sampleSize; j++) {
        sample.push(data[Math.floor(Math.random() * data.length)]);
      }
      
      const tree = new IsolationTree();
      tree.fit(sample, attrs, 0, this.maxDepth);
      this.trees.push(tree);
    }
  }

  anomalyScore(point: number[]): number {
    const avgPath = this.trees.reduce((sum, tree) => sum + tree.pathLength(point, 0), 0) / this.trees.length;
    const c = this.c(256);
    return Math.pow(2, -avgPath / c);
  }

  private c(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }
}

function generateExplanation(tender: Tender, score: number, isAnomaly: boolean): string {
  if (!isAnomaly) {
    return `This tender follows normal procurement patterns (anomaly score: ${score.toFixed(3)}).`;
  }

  const reasons = [];
  
  if (tender.procurement_method === 'Open' && tender.tender_duration_days < 14) {
    reasons.push(`unusually short duration (${tender.tender_duration_days} days) for an Open tender`);
  }
  
  if (tender.number_of_bidders === 1) {
    reasons.push('only 1 bidder participated, suggesting limited competition');
  } else if (tender.number_of_bidders <= 2 && tender.procurement_method === 'Open') {
    reasons.push(`very few bidders (${tender.number_of_bidders}) for an Open tender`);
  }
  
  if (tender.procurement_method === 'Open' && tender.tender_duration_days < 10 && tender.number_of_bidders <= 2) {
    reasons.push('combination of short duration and few bidders suggests tender may have been "wired" for specific supplier');
  }

  if (reasons.length === 0) {
    reasons.push('statistical deviation from normal procurement patterns');
  }

  return `PROCESS RED FLAG (score: ${score.toFixed(3)}): This tender shows suspicious procedural patterns - ${reasons.join('; ')}.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tenders, error: fetchError } = await supabase
      .from('tenders')
      .select('*');

    if (fetchError) throw fetchError;
    if (!tenders || tenders.length === 0) {
      throw new Error('No tender data found. Please generate data first.');
    }

    const trainingData = tenders.map((t: Tender) => [
      t.tender_duration_days,
      t.number_of_bidders,
      t.procurement_method === 'Open' ? 1 : 0
    ]);

    const forest = new IsolationForest(100);
    forest.fit(trainingData, ['tender_duration_days', 'number_of_bidders', 'method_encoded']);

    const results = [];
    let anomalyCount = 0;

    for (const tender of tenders) {
      const point = [
        tender.tender_duration_days,
        tender.number_of_bidders,
        tender.procurement_method === 'Open' ? 1 : 0
      ];

      const score = forest.anomalyScore(point);
      const isAnomaly = score > 0.6;
      
      if (isAnomaly) anomalyCount++;

      results.push({
        tender_id: tender.tender_id,
        model_type: 'process',
        is_anomaly: isAnomaly,
        anomaly_score: score,
        explanation: generateExplanation(tender, score, isAnomaly)
      });
    }

    await supabase.from('audit_results').delete().eq('model_type', 'process');

    const { error: insertError } = await supabase.from('audit_results').insert(results);
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Process anomaly detection completed',
        totalTenders: tenders.length,
        anomaliesDetected: anomalyCount,
        anomalyRate: (anomalyCount / tenders.length * 100).toFixed(2) + '%'
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