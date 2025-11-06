import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const marketItems = [
  { name: 'Office Chair', category: 'Office Furniture', basePrice: 15000, stdDev: 3000 },
  { name: 'Office Desk', category: 'Office Furniture', basePrice: 25000, stdDev: 5000 },
  { name: 'Filing Cabinet', category: 'Office Furniture', basePrice: 12000, stdDev: 2000 },
  { name: 'Conference Table', category: 'Office Furniture', basePrice: 45000, stdDev: 8000 },
  { name: 'Laptop', category: 'IT Equipment', basePrice: 65000, stdDev: 8000 },
  { name: 'Desktop Computer', category: 'IT Equipment', basePrice: 45000, stdDev: 6000 },
  { name: 'Printer', category: 'IT Equipment', basePrice: 20000, stdDev: 4000 },
  { name: 'Network Router', category: 'IT Equipment', basePrice: 8000, stdDev: 1500 },
  { name: 'Monitor', category: 'IT Equipment', basePrice: 18000, stdDev: 3000 },
  { name: 'Projector', category: 'IT Equipment', basePrice: 35000, stdDev: 5000 },
  { name: 'Sedan Vehicle', category: 'Vehicles', basePrice: 1800000, stdDev: 200000 },
  { name: 'SUV Vehicle', category: 'Vehicles', basePrice: 3500000, stdDev: 400000 },
  { name: 'Pickup Truck', category: 'Vehicles', basePrice: 2200000, stdDev: 250000 },
  { name: 'Surgical Gloves (Box)', category: 'Medical Supplies', basePrice: 500, stdDev: 100 },
  { name: 'Face Masks (Box)', category: 'Medical Supplies', basePrice: 300, stdDev: 50 },
  { name: 'Stethoscope', category: 'Medical Supplies', basePrice: 3500, stdDev: 500 },
  { name: 'Blood Pressure Monitor', category: 'Medical Supplies', basePrice: 2500, stdDev: 400 },
  { name: 'Cement (Bag)', category: 'Construction Materials', basePrice: 650, stdDev: 50 },
  { name: 'Steel Bars (Ton)', category: 'Construction Materials', basePrice: 55000, stdDev: 5000 },
  { name: 'Paint (5L)', category: 'Construction Materials', basePrice: 1200, stdDev: 200 },
  { name: 'A4 Paper (Ream)', category: 'Stationery', basePrice: 450, stdDev: 50 },
  { name: 'Pen (Box)', category: 'Stationery', basePrice: 200, stdDev: 30 },
  { name: 'Stapler', category: 'Stationery', basePrice: 150, stdDev: 30 }
];

const sources = [
  'Jumia Kenya', 'Masoko', 'Kilimall', 'Nairobi Hardware',
  'Computer Planet', 'Hotpoint Appliances', 'Furniture Palace',
  'City Hardware', 'Tech Zone', 'Office Mart'
];

function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(1, Math.round(mean + z0 * stdDev));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count = 1000 } = await req.json().catch(() => ({ count: 1000 }));

    const marketPrices = [];

    for (let i = 0; i < count; i++) {
      const item = randomChoice(marketItems);
      const price = normalRandom(item.basePrice, item.stdDev);
      
      marketPrices.push({
        item_name: item.name,
        category: item.category,
        unit_price: price,
        source: randomChoice(sources)
      });
    }

    await supabase.from('market_prices').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error } = await supabase.from('market_prices').insert(marketPrices);
    if (error) throw error;

    const stats = marketItems.map(item => {
      const itemPrices = marketPrices.filter(p => p.item_name === item.name).map(p => p.unit_price);
      const avg = itemPrices.reduce((a, b) => a + b, 0) / itemPrices.length;
      return {
        item: item.name,
        count: itemPrices.length,
        average: Math.round(avg),
        expected: item.basePrice
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${marketPrices.length} market price records`,
        count: marketPrices.length,
        stats: stats
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