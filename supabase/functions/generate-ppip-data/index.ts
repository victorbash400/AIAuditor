import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const kenyanEntities = [
  'Ministry of Health', 'Ministry of Education', 'Kenya Roads Board',
  'National Treasury', 'County Government of Nairobi', 'County Government of Mombasa',
  'Kenya Power and Lighting Company', 'Kenya Railways Corporation', 'Kenya Ports Authority'
];

const kenyanCompanies = [
  'Safaricom Supplies Ltd', 'Equity Bank Contractors', 'KCB Holdings Services',
  'Bamburi Cement Company', 'East African Breweries Logistics', 'Kenya Airways Catering',
  'Nation Media Group Supplies', 'Uchumi Supermarkets Ltd', 'Naivas Supplies Ltd'
];

const categories = [
  'Office Furniture', 'IT Equipment', 'Vehicles', 'Medical Supplies',
  'Construction Materials', 'Stationery', 'Consulting Services', 'Catering Services'
];

const itemsByCategory: { [key: string]: { name: string; basePrice: number; stdDev: number }[] } = {
  'Office Furniture': [
    { name: 'Office Chair', basePrice: 15000, stdDev: 3000 },
    { name: 'Office Desk', basePrice: 25000, stdDev: 5000 },
    { name: 'Filing Cabinet', basePrice: 12000, stdDev: 2000 }
  ],
  'IT Equipment': [
    { name: 'Laptop', basePrice: 65000, stdDev: 8000 },
    { name: 'Desktop Computer', basePrice: 45000, stdDev: 6000 },
    { name: 'Printer', basePrice: 20000, stdDev: 4000 },
    { name: 'Network Router', basePrice: 8000, stdDev: 1500 }
  ],
  'Vehicles': [
    { name: 'Sedan Vehicle', basePrice: 1800000, stdDev: 200000 },
    { name: 'SUV Vehicle', basePrice: 3500000, stdDev: 400000 },
    { name: 'Pickup Truck', basePrice: 2200000, stdDev: 250000 }
  ],
  'Medical Supplies': [
    { name: 'Surgical Gloves (Box)', basePrice: 500, stdDev: 100 },
    { name: 'Face Masks (Box)', basePrice: 300, stdDev: 50 },
    { name: 'Stethoscope', basePrice: 3500, stdDev: 500 }
  ],
  'Construction Materials': [
    { name: 'Cement (Bag)', basePrice: 650, stdDev: 50 },
    { name: 'Steel Bars (Ton)', basePrice: 55000, stdDev: 5000 },
    { name: 'Paint (5L)', basePrice: 1200, stdDev: 200 }
  ],
  'Stationery': [
    { name: 'A4 Paper (Ream)', basePrice: 450, stdDev: 50 },
    { name: 'Pen (Box)', basePrice: 200, stdDev: 30 },
    { name: 'Stapler', basePrice: 150, stdDev: 30 }
  ]
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(mean + z0 * stdDev);
}

function generateTenderDescription(category: string, items: string[]): string {
  return `Supply and delivery of ${items.join(', ')} for ${category.toLowerCase()} requirements as per specifications.`;
}

function generateTechnicalSpecs(items: string[], isBiased: boolean): string {
  const brandNames = ['Herman Miller', 'Dell', 'HP', 'Toyota', 'Microsoft'];
  let specs = items.map(item => `- ${item}: High quality, meeting international standards`).join('\n');
  
  if (isBiased && Math.random() > 0.5) {
    const brand = randomChoice(brandNames);
    specs += `\n- Brand requirement: Must be ${brand} brand only`;
  }
  
  return specs;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count = 50 } = await req.json().catch(() => ({ count: 50 }));

    const tenders = [];
    const contracts = [];

    for (let i = 0; i < count; i++) {
      const tenderId = `TND-2024-${String(i + 1).padStart(5, '0')}`;
      const category = randomChoice(categories);
      const procurementMethod = randomChoice(['Open', 'Restricted']);
      
      const isAnomalous = Math.random() < 0.05;
      
      let durationDays: number;
      let numBidders: number;
      
      if (isAnomalous && procurementMethod === 'Open') {
        durationDays = randomInt(3, 7);
        numBidders = 1;
      } else if (procurementMethod === 'Open') {
        durationDays = randomInt(21, 60);
        numBidders = randomInt(3, 15);
      } else {
        durationDays = randomInt(14, 30);
        numBidders = randomInt(2, 6);
      }

      const categoryItems = itemsByCategory[category] || [];
      const selectedItems = categoryItems.slice(0, randomInt(1, Math.min(3, categoryItems.length)));
      const itemNames = selectedItems.map(item => item.name);
      
      const isBiased = Math.random() < 0.05;

      tenders.push({
        tender_id: tenderId,
        procuring_entity: randomChoice(kenyanEntities),
        tender_title: `Procurement of ${category}`,
        category: category,
        procurement_method: procurementMethod,
        tender_duration_days: durationDays,
        number_of_bidders: numBidders,
        tender_description: generateTenderDescription(category, itemNames),
        technical_specs: generateTechnicalSpecs(itemNames, isBiased)
      });

      for (const itemData of selectedItems) {
        const isPriceAnomalous = isAnomalous && Math.random() < 0.3;
        let unitPrice: number;
        
        if (isPriceAnomalous) {
          unitPrice = Math.round(itemData.basePrice * randomInt(3, 6));
        } else {
          unitPrice = Math.max(1, normalRandom(itemData.basePrice, itemData.stdDev));
        }

        const quantity = randomInt(5, 100);
        
        contracts.push({
          contract_id: `CNT-2024-${String(contracts.length + 1).padStart(5, '0')}`,
          tender_id: tenderId,
          supplier_name: randomChoice(kenyanCompanies),
          item_description: itemData.name,
          unit_price: unitPrice,
          quantity: quantity,
          total_value: unitPrice * quantity
        });
      }
    }

    await supabase.from('tenders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: tendersError } = await supabase.from('tenders').insert(tenders);
    if (tendersError) throw tendersError;

    const { error: contractsError } = await supabase.from('contracts').insert(contracts);
    if (contractsError) throw contractsError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${tenders.length} tenders and ${contracts.length} contracts`,
        tenders: tenders.length,
        contracts: contracts.length
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