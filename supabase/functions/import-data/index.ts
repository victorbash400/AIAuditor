import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function parseCSV(text: string): any[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    data.push(row);
  }

  return data;
}

function validateTenderRow(row: any): { valid: boolean; error?: string } {
  const required = ['tender_id', 'procuring_entity', 'tender_title', 'category', 
                    'procurement_method', 'tender_duration_days', 'number_of_bidders', 
                    'tender_description'];
  
  for (const field of required) {
    if (!row[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  const duration = parseInt(row.tender_duration_days);
  if (isNaN(duration) || duration <= 0) {
    return { valid: false, error: 'tender_duration_days must be a positive number' };
  }

  const bidders = parseInt(row.number_of_bidders);
  if (isNaN(bidders) || bidders < 0) {
    return { valid: false, error: 'number_of_bidders must be a non-negative number' };
  }

  if (!['Open', 'Restricted'].includes(row.procurement_method)) {
    return { valid: false, error: 'procurement_method must be "Open" or "Restricted"' };
  }

  return { valid: true };
}

function validateContractRow(row: any): { valid: boolean; error?: string } {
  const required = ['contract_id', 'tender_id', 'supplier_name', 'item_description', 
                    'unit_price', 'quantity'];
  
  for (const field of required) {
    if (!row[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  const price = parseFloat(row.unit_price);
  if (isNaN(price) || price <= 0) {
    return { valid: false, error: 'unit_price must be a positive number' };
  }

  const qty = parseInt(row.quantity);
  if (isNaN(qty) || qty <= 0) {
    return { valid: false, error: 'quantity must be a positive number' };
  }

  return { valid: true };
}

function validateMarketPriceRow(row: any): { valid: boolean; error?: string } {
  const required = ['item_name', 'category', 'unit_price', 'source'];
  
  for (const field of required) {
    if (!row[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  const price = parseFloat(row.unit_price);
  if (isNaN(price) || price <= 0) {
    return { valid: false, error: 'unit_price must be a positive number' };
  }

  return { valid: true };
}

function transformTenderRow(row: any): any {
  return {
    tender_id: row.tender_id,
    procuring_entity: row.procuring_entity,
    tender_title: row.tender_title,
    category: row.category,
    procurement_method: row.procurement_method,
    tender_duration_days: parseInt(row.tender_duration_days),
    number_of_bidders: parseInt(row.number_of_bidders),
    tender_description: row.tender_description,
    technical_specs: row.technical_specs || ''
  };
}

function transformContractRow(row: any): any {
  const unitPrice = parseFloat(row.unit_price);
  const quantity = parseInt(row.quantity);
  
  return {
    contract_id: row.contract_id,
    tender_id: row.tender_id,
    supplier_name: row.supplier_name,
    item_description: row.item_description,
    unit_price: unitPrice,
    quantity: quantity,
    total_value: unitPrice * quantity
  };
}

function transformMarketPriceRow(row: any): any {
  return {
    item_name: row.item_name,
    category: row.category,
    unit_price: parseFloat(row.unit_price),
    source: row.source
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dataType, csvContent, clearExisting } = await req.json();

    if (!dataType || !csvContent) {
      throw new Error('Missing required fields: dataType and csvContent');
    }

    if (!['tenders', 'contracts', 'market_prices'].includes(dataType)) {
      throw new Error('Invalid dataType. Must be tenders, contracts, or market_prices');
    }

    const rows = parseCSV(csvContent);
    if (rows.length === 0) {
      throw new Error('No valid data found in CSV');
    }

    let validationErrors: string[] = [];
    let validRows: any[] = [];

    if (dataType === 'tenders') {
      rows.forEach((row, index) => {
        const validation = validateTenderRow(row);
        if (validation.valid) {
          validRows.push(transformTenderRow(row));
        } else {
          validationErrors.push(`Row ${index + 2}: ${validation.error}`);
        }
      });
    } else if (dataType === 'contracts') {
      rows.forEach((row, index) => {
        const validation = validateContractRow(row);
        if (validation.valid) {
          validRows.push(transformContractRow(row));
        } else {
          validationErrors.push(`Row ${index + 2}: ${validation.error}`);
        }
      });
    } else if (dataType === 'market_prices') {
      rows.forEach((row, index) => {
        const validation = validateMarketPriceRow(row);
        if (validation.valid) {
          validRows.push(transformMarketPriceRow(row));
        } else {
          validationErrors.push(`Row ${index + 2}: ${validation.error}`);
        }
      });
    }

    if (validRows.length === 0) {
      throw new Error(`No valid rows found. Errors: ${validationErrors.join('; ')}`);
    }

    if (clearExisting) {
      await supabase.from(dataType).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { error: insertError } = await supabase.from(dataType).insert(validRows);
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${validRows.length} ${dataType} records`,
        imported: validRows.length,
        skipped: validationErrors.length,
        errors: validationErrors.length > 0 ? validationErrors : undefined
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