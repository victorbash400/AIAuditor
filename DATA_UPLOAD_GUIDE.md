# Data Upload Guide

## Overview
The AI Auditor supports importing your own procurement data in CSV format. This allows you to analyze real-world data from your organization.

## Supported Data Types

### 1. Tenders
CSV with procurement tender information.

**Required Columns:**
- `tender_id` - Unique identifier (e.g., TND-2024-00001)
- `procuring_entity` - Organization name (e.g., Ministry of Health)
- `tender_title` - Descriptive title (e.g., Procurement of Medical Equipment)
- `category` - Category name (e.g., Medical Supplies, IT Equipment, Vehicles)
- `procurement_method` - Must be "Open" or "Restricted"
- `tender_duration_days` - Positive integer (e.g., 30)
- `number_of_bidders` - Non-negative integer (e.g., 5)
- `tender_description` - Detailed description text
- `technical_specs` - Optional technical specifications

**Example CSV:**
```csv
tender_id,procuring_entity,tender_title,category,procurement_method,tender_duration_days,number_of_bidders,tender_description,technical_specs
TND-2024-00001,Ministry of Health,Procurement of Medical Equipment,Medical Supplies,Open,30,5,Supply and delivery of medical equipment,High quality medical grade equipment
TND-2024-00002,County Government of Nairobi,Office Furniture Supply,Office Furniture,Restricted,21,3,Supply of ergonomic office chairs and desks,Must meet ISO standards
```

### 2. Contracts
CSV with contract award details linked to tenders.

**Required Columns:**
- `contract_id` - Unique identifier (e.g., CNT-2024-00001)
- `tender_id` - Must match an existing tender_id
- `supplier_name` - Company name (e.g., ABC Suppliers Ltd)
- `item_description` - Item name (e.g., Laptop, Office Chair)
- `unit_price` - Positive number (e.g., 65000)
- `quantity` - Positive integer (e.g., 10)

**Example CSV:**
```csv
contract_id,tender_id,supplier_name,item_description,unit_price,quantity
CNT-2024-00001,TND-2024-00001,Medical Supplies Ltd,Stethoscope,3500,50
CNT-2024-00002,TND-2024-00001,HealthCare Inc,Blood Pressure Monitor,2500,30
```

### 3. Market Prices
CSV with market price data for comparison.

**Required Columns:**
- `item_name` - Product name (e.g., Laptop, Office Chair)
- `category` - Category name (e.g., IT Equipment)
- `unit_price` - Positive number (e.g., 65000)
- `source` - Source name (e.g., Jumia Kenya, Amazon)

**Example CSV:**
```csv
item_name,category,unit_price,source
Laptop,IT Equipment,65000,Jumia Kenya
Laptop,IT Equipment,68000,Computer Planet
Office Chair,Office Furniture,15000,Furniture Palace
Office Chair,Office Furniture,14500,Office Mart
```

## Upload Process

1. **Navigate to Upload Tab** - Click "Upload" in the main navigation
2. **Select Data Type** - Choose tenders, contracts, or market_prices
3. **Download Template** - Click "Download Template" to get a CSV template with correct format
4. **Prepare Your Data** - Fill the template with your data
5. **Choose Import Mode**:
   - Unchecked: Append data to existing records
   - Checked: Clear all existing data before import
6. **Upload File** - Click "Click to select a CSV file" and choose your prepared CSV
7. **Review Results** - Check the success message and any validation errors

## Validation Rules

### Common Rules
- All required fields must be present
- No duplicate IDs within the same upload
- Numbers must be valid (no text in numeric fields)

### Tenders
- `tender_duration_days` must be > 0
- `number_of_bidders` must be >= 0
- `procurement_method` must be exactly "Open" or "Restricted"

### Contracts
- `tender_id` should exist (if tenders already imported)
- `unit_price` must be > 0
- `quantity` must be > 0

### Market Prices
- `unit_price` must be > 0

## Tips for Success

1. **Use Templates** - Always start with the downloaded template
2. **Check Formatting** - Ensure CSV is properly formatted with commas
3. **No Extra Columns** - Only include required columns (extra columns will be ignored)
4. **Validate First** - Upload a small sample first to check for errors
5. **Clear Old Data** - Use "Clear existing data" when doing a complete data refresh
6. **Link Data** - Upload tenders first, then contracts (contracts reference tender_ids)

## Error Handling

The system will:
- Validate each row individually
- Import all valid rows
- Report specific errors for invalid rows (e.g., "Row 5: Missing required field: category")
- Show count of imported vs skipped records

## After Upload

1. Navigate to **Pipeline** tab
2. Click **Run Full Pipeline** to analyze your uploaded data
3. View results in **Dashboard** and **Tenders** tabs
4. Check **Evaluation** tab for model performance metrics

## Example Workflow

1. Upload tenders CSV (100 records)
2. Upload contracts CSV (250 records linked to tenders)
3. Upload market prices CSV (1000 records)
4. Run pipeline to execute all 3 ML models
5. Review flagged tenders in Tenders tab
6. Check model accuracy in Evaluation tab

## Troubleshooting

**Problem**: "No valid rows found"
- **Solution**: Check that CSV has header row and at least one data row

**Problem**: "Missing required field"
- **Solution**: Ensure all required columns are present with exact names

**Problem**: "tender_duration_days must be a positive number"
- **Solution**: Check that numeric fields contain only numbers, no text

**Problem**: Upload succeeds but some rows skipped
- **Solution**: Review the validation errors list to see which rows had issues
