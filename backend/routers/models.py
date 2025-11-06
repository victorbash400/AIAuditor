from fastapi import APIRouter, HTTPException
from database import TenderDB, ContractDB, MarketPriceDB, AuditResultDB
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import re

router = APIRouter()

@router.post("/process-anomaly")
async def detect_process_anomalies():
    try:
        tenders = TenderDB.get_all()

        if not tenders:
            raise HTTPException(status_code=404, detail="No tenders found")

        df = pd.DataFrame(tenders)

        le = LabelEncoder()
        df['method_encoded'] = le.fit_transform(df['procurement_method'])

        X = df[['tender_duration_days', 'number_of_bidders', 'method_encoded']].values

        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
            max_samples='auto'
        )

        predictions = iso_forest.fit_predict(X)
        scores = iso_forest.score_samples(X)

        anomalies = predictions == -1

        audit_results = AuditResultDB.get_all()
        for result in audit_results:
            if result['model_type'] == 'process':
                AuditResultDB.delete_all()
                break

        anomaly_count = 0
        for idx, (_, row) in enumerate(df.iterrows()):
            is_anomaly = bool(anomalies[idx])
            if is_anomaly:
                anomaly_count += 1

            anomaly_score = float(-scores[idx])

            reasons = []
            if row['tender_duration_days'] < 14:
                reasons.append(f"Very short duration ({row['tender_duration_days']} days)")
            if row['number_of_bidders'] <= 2:
                reasons.append(f"Low competition ({row['number_of_bidders']} bidders)")
            if row['procurement_method'] == 'Restricted':
                reasons.append("Restricted tender method")

            explanation = " | ".join(reasons) if is_anomaly else "Normal procurement process"

            AuditResultDB.insert({
                'tender_id': row['tender_id'],
                'model_type': 'process',
                'is_anomaly': is_anomaly,
                'anomaly_score': anomaly_score,
                'explanation': explanation
            })

        return {
            'success': True,
            'message': f'Processed {len(df)} tenders, found {anomaly_count} anomalies',
            'total_processed': len(df),
            'anomalies_found': anomaly_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/price-anomaly")
async def detect_price_anomalies():
    try:
        contracts = ContractDB.get_all()
        market_prices = MarketPriceDB.get_all()

        if not contracts:
            raise HTTPException(status_code=404, detail="No contracts found")

        if not market_prices:
            raise HTTPException(status_code=404, detail="No market prices found")

        contracts_df = pd.DataFrame(contracts)
        market_df = pd.DataFrame(market_prices)

        def normalize_text(text):
            return re.sub(r'[^a-z0-9]', '', text.lower())

        contracts_df['item_normalized'] = contracts_df['item_description'].apply(normalize_text)
        market_df['item_normalized'] = market_df['item_name'].apply(normalize_text)

        market_stats = market_df.groupby('item_normalized')['unit_price'].agg([
            ('mean', 'mean'),
            ('std', 'std'),
            ('count', 'count')
        ]).reset_index()

        audit_results = AuditResultDB.get_all()
        for result in audit_results:
            if result['model_type'] == 'price':
                AuditResultDB.delete_all()
                break

        anomaly_count = 0
        for _, contract in contracts_df.iterrows():
            item_norm = contract['item_normalized']
            stats_row = market_stats[market_stats['item_normalized'] == item_norm]

            if len(stats_row) == 0:
                explanation = f"No market data available for {contract['item_description']}"
                is_anomaly = False
                confidence_score = 0.0
            else:
                mean_price = float(stats_row.iloc[0]['mean'])
                std_price = float(stats_row.iloc[0]['std'])

                if std_price == 0:
                    z_score = 0
                else:
                    z_score = (contract['unit_price'] - mean_price) / std_price

                is_anomaly = abs(z_score) > 2.5

                if is_anomaly:
                    anomaly_count += 1
                    if z_score > 0:
                        pct_diff = ((contract['unit_price'] - mean_price) / mean_price) * 100
                        explanation = f"Price {pct_diff:.1f}% ABOVE market average (Z-score: {z_score:.2f}). Potential overpayment of KES {(contract['unit_price'] - mean_price) * contract['quantity']:,.0f}"
                    else:
                        pct_diff = ((mean_price - contract['unit_price']) / mean_price) * 100
                        explanation = f"Price {pct_diff:.1f}% BELOW market average (Z-score: {z_score:.2f}). Unusually low price may indicate quality concerns"
                else:
                    explanation = f"Price within normal range (Z-score: {z_score:.2f})"

                confidence_score = float(abs(z_score))

            AuditResultDB.insert({
                'tender_id': contract['tender_id'],
                'contract_id': contract.get('contract_id'),
                'model_type': 'price',
                'is_anomaly': is_anomaly,
                'anomaly_score': confidence_score,
                'explanation': explanation
            })

        return {
            'success': True,
            'message': f'Analyzed {len(contracts_df)} contracts, found {anomaly_count} price anomalies',
            'total_processed': len(contracts_df),
            'anomalies_found': anomaly_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text-anomaly")
async def detect_text_anomalies():
    try:
        tenders = TenderDB.get_all()

        if not tenders:
            raise HTTPException(status_code=404, detail="No tenders found")

        df = pd.DataFrame(tenders)

        df['combined_text'] = df['tender_description'] + ' ' + df['technical_specs'].fillna('')

        vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2)
        )

        tfidf_matrix = vectorizer.fit_transform(df['combined_text'])
        similarity_matrix = cosine_similarity(tfidf_matrix)

        brand_keywords = [
            'herman miller', 'dell', 'hp', 'lenovo', 'apple', 'microsoft',
            'samsung', 'lg', 'sony', 'canon', 'epson', 'toyota', 'nissan',
            'ford', 'mercedes', 'bmw', 'cisco', 'intel', 'amd', 'oracle'
        ]

        audit_results = AuditResultDB.get_all()
        for result in audit_results:
            if result['model_type'] == 'text':
                AuditResultDB.delete_all()
                break

        anomaly_count = 0
        for idx, (_, row) in enumerate(df.iterrows()):
            combined_lower = row['combined_text'].lower()

            detected_brands = [brand for brand in brand_keywords if brand in combined_lower]
            has_brand_bias = len(detected_brands) > 0

            similarities = similarity_matrix[idx]
            similar_indices = np.where((similarities > 0.85) & (similarities < 1.0))[0]
            has_collusion = len(similar_indices) > 0

            is_anomaly = has_brand_bias or has_collusion
            if is_anomaly:
                anomaly_count += 1

            explanations = []
            if has_brand_bias:
                explanations.append(f"Brand bias detected: {', '.join(detected_brands)}")
            if has_collusion:
                similar_tenders = [df.iloc[i]['tender_id'] for i in similar_indices]
                explanations.append(f"High similarity to {len(similar_indices)} other tender(s): {', '.join(similar_tenders[:3])}")

            explanation = " | ".join(explanations) if is_anomaly else "No text anomalies detected"

            confidence = 0.0
            if has_brand_bias:
                confidence += 0.5
            if has_collusion:
                confidence += max(similarities[similar_indices]) if len(similar_indices) > 0 else 0

            AuditResultDB.insert({
                'tender_id': row['tender_id'],
                'model_type': 'text',
                'is_anomaly': is_anomaly,
                'anomaly_score': float(min(confidence, 1.0)),
                'explanation': explanation
            })

        return {
            'success': True,
            'message': f'Analyzed {len(df)} tenders, found {anomaly_count} text anomalies',
            'total_processed': len(df),
            'anomalies_found': anomaly_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run-all")
async def run_all_models():
    try:
        process_result = await detect_process_anomalies()
        price_result = await detect_price_anomalies()
        text_result = await detect_text_anomalies()

        return {
            'success': True,
            'message': 'All models executed successfully',
            'results': {
                'process': process_result,
                'price': price_result,
                'text': text_result
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
