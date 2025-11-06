import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Tender {
  tender_id: string;
  tender_description: string;
  technical_specs: string;
}

const brandNames = [
  'Herman Miller', 'Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft',
  'Samsung', 'LG', 'Sony', 'Canon', 'Epson', 'Toyota', 'Nissan',
  'Ford', 'Mercedes', 'BMW', 'Cisco', 'Intel', 'AMD', 'Oracle'
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const total = tokens.length;

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  for (const [token, count] of tf.entries()) {
    tf.set(token, count / total);
  }

  return tf;
}

function calculateIDF(documents: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const docCount = documents.length;
  const vocabulary = new Set<string>();

  for (const doc of documents) {
    for (const token of doc) {
      vocabulary.add(token);
    }
  }

  for (const term of vocabulary) {
    const docsWithTerm = documents.filter(doc => doc.includes(term)).length;
    idf.set(term, Math.log(docCount / (1 + docsWithTerm)));
  }

  return idf;
}

function calculateTFIDF(tf: Map<string, number>, idf: Map<string, number>): Map<string, number> {
  const tfidf = new Map<string, number>();

  for (const [term, tfValue] of tf.entries()) {
    const idfValue = idf.get(term) || 0;
    tfidf.set(term, tfValue * idfValue);
  }

  return tfidf;
}

function cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);

  for (const term of allTerms) {
    const v1 = vec1.get(term) || 0;
    const v2 = vec2.get(term) || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

function detectBrandBias(text: string): { hasBias: boolean; brands: string[] } {
  const lowerText = text.toLowerCase();
  const detectedBrands: string[] = [];

  for (const brand of brandNames) {
    if (lowerText.includes(brand.toLowerCase())) {
      detectedBrands.push(brand);
    }
  }

  return {
    hasBias: detectedBrands.length > 0,
    brands: detectedBrands
  };
}

function generateCollusionExplanation(
  tender1: Tender,
  tender2: Tender,
  similarity: number
): string {
  return `COLLUSION DETECTED: This tender's description is ${(similarity * 100).toFixed(1)}% identical to tender ${tender2.tender_id}. Such high textual similarity suggests possible copy-pasting or coordination between tenders, which may indicate collusion or lack of genuine competitive process.`;
}

function generateBiasExplanation(tender: Tender, brands: string[]): string {
  return `BIAS DETECTED: Technical specifications contain explicit brand requirements (${brands.join(', ')}). This violates fair procurement principles by excluding competition and potentially favoring specific suppliers. Specifications should be performance-based, not brand-specific.`;
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

    const tokenizedDocs = tenders.map((t: Tender) => 
      tokenize(t.tender_description + ' ' + (t.technical_specs || ''))
    );

    const idf = calculateIDF(tokenizedDocs);

    const tfidfVectors = tokenizedDocs.map(tokens => {
      const tf = calculateTF(tokens);
      return calculateTFIDF(tf, idf);
    });

    const results = [];
    let anomalyCount = 0;
    const collusionPairs = new Set<string>();

    for (let i = 0; i < tenders.length; i++) {
      const tender = tenders[i];
      let isAnomaly = false;
      let explanation = 'No textual anomalies detected. Tender language appears fair and unique.';
      let score = 0;

      const biasCheck = detectBrandBias((tender.technical_specs || '') + ' ' + tender.tender_description);
      if (biasCheck.hasBias) {
        isAnomaly = true;
        score = 0.9;
        explanation = generateBiasExplanation(tender, biasCheck.brands);
        anomalyCount++;
      }

      let maxSimilarity = 0;
      let similarTender = null;

      for (let j = 0; j < tenders.length; j++) {
        if (i === j) continue;

        const similarity = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          similarTender = tenders[j];
        }
      }

      if (maxSimilarity > 0.85 && similarTender) {
        const pairKey = [tender.tender_id, similarTender.tender_id].sort().join('-');
        
        if (!collusionPairs.has(pairKey)) {
          collusionPairs.add(pairKey);
          isAnomaly = true;
          score = Math.max(score, maxSimilarity);
          
          if (biasCheck.hasBias) {
            explanation += ' ALSO: ' + generateCollusionExplanation(tender, similarTender, maxSimilarity);
          } else {
            explanation = generateCollusionExplanation(tender, similarTender, maxSimilarity);
          }
          
          if (!biasCheck.hasBias) anomalyCount++;
        }
      }

      results.push({
        tender_id: tender.tender_id,
        model_type: 'text',
        is_anomaly: isAnomaly,
        anomaly_score: score,
        explanation: explanation
      });
    }

    await supabase.from('audit_results').delete().eq('model_type', 'text');

    const { error: insertError } = await supabase.from('audit_results').insert(results);
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Text anomaly detection completed',
        totalTenders: tenders.length,
        anomaliesDetected: anomalyCount,
        anomalyRate: (anomalyCount / tenders.length * 100).toFixed(2) + '%',
        collusionPairsFound: collusionPairs.size
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