from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import TenderDB, ContractDB, MarketPriceDB, AuditResultDB
import pandas as pd
import io
import random

router = APIRouter()

@router.get("/tenders")
async def get_tenders():
    try:
        tenders = TenderDB.get_all()
        return {"data": tenders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contracts")
async def get_contracts():
    try:
        contracts = ContractDB.get_all()
        return {"data": contracts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-results")
async def get_audit_results():
    try:
        results = AuditResultDB.get_all()
        return {"data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DataImport(BaseModel):
    dataType: str
    csvContent: str
    clearExisting: bool = False

@router.post("/import")
async def import_data(data: DataImport):
    try:
        if data.dataType not in ['tenders', 'contracts', 'market_prices']:
            raise HTTPException(status_code=400, detail="Invalid dataType")

        csv_io = io.StringIO(data.csvContent)
        df = pd.read_csv(csv_io)

        if len(df) == 0:
            raise HTTPException(status_code=400, detail="No data found in CSV")

        validation_errors = []
        valid_rows = []

        if data.dataType == 'tenders':
            required_cols = ['tender_id', 'procuring_entity', 'tender_title', 'category',
                           'procurement_method', 'tender_duration_days', 'number_of_bidders',
                           'tender_description']

            for col in required_cols:
                if col not in df.columns:
                    raise HTTPException(status_code=400, detail=f"Missing required column: {col}")

            for idx, row in df.iterrows():
                try:
                    if pd.isna(row['tender_id']) or row['tender_id'] == '':
                        raise ValueError("tender_id is required")

                    duration = int(row['tender_duration_days'])
                    if duration <= 0:
                        raise ValueError("tender_duration_days must be positive")

                    bidders = int(row['number_of_bidders'])
                    if bidders < 0:
                        raise ValueError("number_of_bidders must be non-negative")

                    if row['procurement_method'] not in ['Open', 'Restricted']:
                        raise ValueError("procurement_method must be 'Open' or 'Restricted'")

                    valid_row = {
                        'tender_id': str(row['tender_id']),
                        'procuring_entity': str(row['procuring_entity']),
                        'tender_title': str(row['tender_title']),
                        'category': str(row['category']),
                        'procurement_method': str(row['procurement_method']),
                        'tender_duration_days': duration,
                        'number_of_bidders': bidders,
                        'tender_description': str(row['tender_description']),
                        'technical_specs': str(row.get('technical_specs', ''))
                    }
                    valid_rows.append(valid_row)

                except Exception as e:
                    validation_errors.append(f"Row {idx + 2}: {str(e)}")

        elif data.dataType == 'contracts':
            required_cols = ['contract_id', 'tender_id', 'supplier_name', 'item_description',
                           'unit_price', 'quantity']

            for col in required_cols:
                if col not in df.columns:
                    raise HTTPException(status_code=400, detail=f"Missing required column: {col}")

            for idx, row in df.iterrows():
                try:
                    unit_price = float(row['unit_price'])
                    if unit_price <= 0:
                        raise ValueError("unit_price must be positive")

                    quantity = int(row['quantity'])
                    if quantity <= 0:
                        raise ValueError("quantity must be positive")

                    valid_row = {
                        'contract_id': str(row['contract_id']),
                        'tender_id': str(row['tender_id']),
                        'supplier_name': str(row['supplier_name']),
                        'item_description': str(row['item_description']),
                        'unit_price': unit_price,
                        'quantity': quantity,
                        'total_value': unit_price * quantity
                    }
                    valid_rows.append(valid_row)

                except Exception as e:
                    validation_errors.append(f"Row {idx + 2}: {str(e)}")

        elif data.dataType == 'market_prices':
            required_cols = ['item_name', 'category', 'unit_price', 'source']

            for col in required_cols:
                if col not in df.columns:
                    raise HTTPException(status_code=400, detail=f"Missing required column: {col}")

            for idx, row in df.iterrows():
                try:
                    unit_price = float(row['unit_price'])
                    if unit_price <= 0:
                        raise ValueError("unit_price must be positive")

                    valid_row = {
                        'item_name': str(row['item_name']),
                        'category': str(row['category']),
                        'unit_price': unit_price,
                        'source': str(row['source'])
                    }
                    valid_rows.append(valid_row)

                except Exception as e:
                    validation_errors.append(f"Row {idx + 2}: {str(e)}")

        if len(valid_rows) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"No valid rows. Errors: {'; '.join(validation_errors[:5])}"
            )

        if data.clearExisting:
            if data.dataType == 'tenders':
                TenderDB.delete_all()
            elif data.dataType == 'contracts':
                ContractDB.delete_all()
            elif data.dataType == 'market_prices':
                MarketPriceDB.delete_all()

        for row in valid_rows:
            if data.dataType == 'tenders':
                TenderDB.insert(row)
            elif data.dataType == 'contracts':
                ContractDB.insert(row)
            elif data.dataType == 'market_prices':
                MarketPriceDB.insert(row)

        return {
            'success': True,
            'message': f'Successfully imported {len(valid_rows)} {data.dataType} records',
            'imported': len(valid_rows),
            'skipped': len(validation_errors),
            'errors': validation_errors if len(validation_errors) > 0 else None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-ppip")
async def generate_ppip_data(count: int = 50):
    try:
        entities = [
            "Ministry of Health", "Ministry of Education", "Ministry of Transport",
            "County Government of Nairobi", "County Government of Mombasa",
            "Kenya Railways", "Kenya Power", "Water Services Board"
        ]

        categories = ["IT Equipment", "Medical Supplies", "Vehicles", "Office Furniture",
                     "Construction Materials", "Consulting Services"]

        methods = ["Open", "Restricted"]

        tenders_data = []
        contracts_data = []

        for i in range(count):
            tender_id = f"TND-2024-{str(i+1).zfill(5)}"
            category = random.choice(categories)

            tender = {
                'tender_id': tender_id,
                'procuring_entity': random.choice(entities),
                'tender_title': f"Procurement of {category} - Batch {i+1}",
                'category': category,
                'procurement_method': random.choice(methods),
                'tender_duration_days': random.randint(7, 60),
                'number_of_bidders': random.randint(1, 8),
                'tender_description': f"Supply and delivery of {category.lower()}",
                'technical_specs': f"Standard specifications for {category.lower()}"
            }
            TenderDB.insert(tender)

            num_contracts = random.randint(1, 3)
            for j in range(num_contracts):
                contract_id = f"CNT-2024-{str(i*3+j+1).zfill(5)}"
                contract = {
                    'contract_id': contract_id,
                    'tender_id': tender_id,
                    'supplier_name': f"Supplier {random.choice(['Ltd', 'Inc', 'Co'])}-{random.randint(1, 100)}",
                    'item_description': f"{category} Item {j+1}",
                    'unit_price': float(random.randint(1000, 100000)),
                    'quantity': random.randint(1, 50),
                    'total_value': 0
                }
                contract['total_value'] = contract['unit_price'] * contract['quantity']
                ContractDB.insert(contract)

        return {
            'success': True,
            'message': f'Generated {count} tenders and contracts'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-market-prices")
async def generate_market_prices(count: int = 1000):
    try:
        items = {
            'IT Equipment': ['Laptop', 'Desktop Computer', 'Printer', 'Scanner', 'Monitor'],
            'Office Furniture': ['Office Chair', 'Desk', 'Filing Cabinet', 'Conference Table'],
            'Medical Supplies': ['Stethoscope', 'Blood Pressure Monitor', 'Thermometer'],
            'Vehicles': ['Sedan', 'SUV', 'Truck', 'Van']
        }

        sources = ['Jumia Kenya', 'Computer Planet', 'Office Mart', 'Medical Supplies Ltd']

        for _ in range(count):
            category = random.choice(list(items.keys()))
            item = random.choice(items[category])

            base_prices = {
                'Laptop': 65000,
                'Desktop Computer': 45000,
                'Office Chair': 15000,
                'Desk': 25000,
                'Stethoscope': 3500,
                'SUV': 3500000
            }

            base_price = base_prices.get(item, 10000)
            variance = random.uniform(0.8, 1.2)

            MarketPriceDB.insert({
                'item_name': item,
                'category': category,
                'unit_price': float(base_price * variance),
                'source': random.choice(sources)
            })

        return {
            'success': True,
            'message': f'Generated {count} market price records'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
