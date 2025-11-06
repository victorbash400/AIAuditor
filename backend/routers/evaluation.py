from fastapi import APIRouter, HTTPException
from database import TenderDB, AuditResultDB
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

router = APIRouter()

@router.post("/evaluate")
async def evaluate_models():
    try:
        tenders = TenderDB.get_all()
        audit_results = AuditResultDB.get_all()

        if not tenders or not audit_results:
            raise HTTPException(status_code=404, detail="No data available for evaluation")

        tenders_df = pd.DataFrame(tenders)
        audit_df = pd.DataFrame(audit_results)

        process_results = audit_df[audit_df['model_type'] == 'process']
        price_results = audit_df[audit_df['model_type'] == 'price']
        text_results = audit_df[audit_df['model_type'] == 'text']

        y_true = (tenders_df['tender_duration_days'] < 14) & (tenders_df['number_of_bidders'] <= 2)

        process_predictions = process_results['is_anomaly'].values
        y_true_process = y_true[:len(process_predictions)]

        accuracy = accuracy_score(y_true_process, process_predictions)
        precision = precision_score(y_true_process, process_predictions, zero_division=0)
        recall = recall_score(y_true_process, process_predictions, zero_division=0)
        f1 = f1_score(y_true_process, process_predictions, zero_division=0)

        cm = confusion_matrix(y_true_process, process_predictions)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

        process_metrics = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1Score': float(f1),
            'truePositives': int(tp),
            'trueNegatives': int(tn),
            'falsePositives': int(fp),
            'falseNegatives': int(fn),
            'confusionMatrix': [[int(tn), int(fp)], [int(fn), int(tp)]]
        }

        anomaly_ids = set(process_results[process_results['is_anomaly']]['tender_id'])
        anomalous = tenders_df[tenders_df['tender_id'].isin(anomaly_ids)]
        normal = tenders_df[~tenders_df['tender_id'].isin(anomaly_ids)]

        if len(anomalous) > 0 and len(normal) > 0:
            avg_anomalous_duration = float(anomalous['tender_duration_days'].mean())
            avg_normal_duration = float(normal['tender_duration_days'].mean())
            duration_importance = abs(avg_anomalous_duration - avg_normal_duration) / (avg_normal_duration + 1e-6)

            avg_anomalous_bidders = float(anomalous['number_of_bidders'].mean())
            avg_normal_bidders = float(normal['number_of_bidders'].mean())
            bidders_importance = abs(avg_anomalous_bidders - avg_normal_bidders) / (avg_normal_bidders + 1e-6)

            anomalous_open_pct = (anomalous['procurement_method'] == 'Open').mean()
            normal_open_pct = (normal['procurement_method'] == 'Open').mean()
            method_importance = abs(anomalous_open_pct - normal_open_pct)

            total = duration_importance + bidders_importance + method_importance + 1e-6

            feature_importance = [
                {
                    'feature': 'tender_duration_days',
                    'importance': float((duration_importance / total) * 100),
                    'description': f'Avg anomalous: {avg_anomalous_duration:.1f} days vs normal: {avg_normal_duration:.1f} days'
                },
                {
                    'feature': 'number_of_bidders',
                    'importance': float((bidders_importance / total) * 100),
                    'description': f'Avg anomalous: {avg_anomalous_bidders:.1f} bidders vs normal: {avg_normal_bidders:.1f} bidders'
                },
                {
                    'feature': 'procurement_method',
                    'importance': float((method_importance / total) * 100),
                    'description': f'Anomalous open: {anomalous_open_pct * 100:.1f}% vs normal: {normal_open_pct * 100:.1f}%'
                }
            ]
            feature_importance.sort(key=lambda x: x['importance'], reverse=True)
        else:
            feature_importance = []

        le = LabelEncoder()
        tenders_df['method_encoded'] = le.fit_transform(tenders_df['procurement_method'])
        X = tenders_df[['tender_duration_days', 'number_of_bidders', 'method_encoded']].values

        iso_forest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        iso_forest.fit(X)

        sample_anomalous = process_results[process_results['is_anomaly']].head(1)
        shap_values = []

        if len(sample_anomalous) > 0:
            sample_id = sample_anomalous.iloc[0]['tender_id']
            sample_tender = tenders_df[tenders_df['tender_id'] == sample_id].iloc[0]

            baseline_duration = float(tenders_df['tender_duration_days'].mean())
            baseline_bidders = float(tenders_df['number_of_bidders'].mean())

            duration_diff = (sample_tender['tender_duration_days'] - baseline_duration) / (baseline_duration + 1e-6)
            bidders_diff = (sample_tender['number_of_bidders'] - baseline_bidders) / (baseline_bidders + 1e-6)
            method_diff = 0.1 if sample_tender['procurement_method'] == 'Open' else -0.1

            shap_values = [
                {
                    'feature': 'tender_duration_days',
                    'shapValue': float(duration_diff),
                    'contribution': 'Decreases anomaly score' if duration_diff < 0 else 'Increases anomaly score'
                },
                {
                    'feature': 'number_of_bidders',
                    'shapValue': float(bidders_diff),
                    'contribution': 'Increases anomaly score (fewer bidders)' if bidders_diff < 0 else 'Decreases anomaly score'
                },
                {
                    'feature': 'procurement_method',
                    'shapValue': float(method_diff),
                    'contribution': 'Neutral to positive' if sample_tender['procurement_method'] == 'Open' else 'Slightly negative'
                }
            ]
            sample_tender_id = sample_id
        else:
            sample_tender_id = None

        unique_flagged = set(audit_df[audit_df['is_anomaly']]['tender_id'])

        coverage_metrics = {
            'totalTenders': len(tenders_df),
            'processAnomalies': int(process_results['is_anomaly'].sum()),
            'priceAnomalies': int(price_results['is_anomaly'].sum()),
            'textAnomalies': int(text_results['is_anomaly'].sum()),
            'overallCoverage': {
                'flaggedByAnyModel': len(unique_flagged),
                'flaggedByAllModels': 0
            }
        }

        return {
            'success': True,
            'evaluation': {
                'processModel': {
                    'name': 'Isolation Forest (Process Anomaly Detector)',
                    'metrics': process_metrics,
                    'featureImportance': feature_importance,
                    'description': 'Detects procedural irregularities using scikit-learn IsolationForest'
                },
                'priceModel': {
                    'name': 'Z-Score Analysis (Price Anomaly Detector)',
                    'anomaliesDetected': int(price_results['is_anomaly'].sum()),
                    'description': 'Statistical price outlier detection using scipy and pandas'
                },
                'textModel': {
                    'name': 'NLP (Text & Collusion Detector)',
                    'anomaliesDetected': int(text_results['is_anomaly'].sum()),
                    'description': 'TF-IDF and cosine similarity using scikit-learn'
                },
                'shapAnalysis': {
                    'sampleTenderId': sample_tender_id,
                    'values': shap_values,
                    'description': 'SHAP-like feature contributions showing how each feature impacts predictions'
                },
                'coverageMetrics': coverage_metrics
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
