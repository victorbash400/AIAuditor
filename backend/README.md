# AI Auditor Python Backend

This is the Python FastAPI backend for the AI Auditor procurement anomaly detection system. It uses industry-standard ML libraries including scikit-learn, pandas, scipy, and SHAP.

## Features

- **Isolation Forest** (scikit-learn) - Process anomaly detection
- **Z-Score Analysis** (scipy + pandas) - Price anomaly detection
- **TF-IDF + Cosine Similarity** (scikit-learn) - Text anomaly & collusion detection
- **Model Evaluation** - Accuracy, Precision, Recall, F1, Confusion Matrix
- **SHAP-like Analysis** - Feature importance and contribution analysis
- **Data Import** - CSV upload with validation
- **Data Generation** - Synthetic test data generation

## Technology Stack

- **FastAPI** - Modern Python web framework
- **scikit-learn** - Machine learning library (Isolation Forest, TF-IDF, etc.)
- **pandas** - Data manipulation and analysis
- **numpy** - Numerical computing
- **scipy** - Statistical analysis (Z-scores)
- **SHAP** - Model explainability
- **Supabase Python SDK** - Database integration

## Installation

### 1. Install Python 3.9+

Ensure you have Python 3.9 or higher installed:

```bash
python3 --version
```

### 2. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
```

### 3. Activate Virtual Environment

**Linux/Mac:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the `backend` directory (or use the existing one):

```bash
SUPABASE_URL=https://vxkmdqnnwyucbsqtqthg.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
API_HOST=0.0.0.0
API_PORT=8000
```

The `.env` file is already configured with your Supabase credentials.

## Running the Server

### Development Mode

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Models

- `POST /api/models/process-anomaly` - Run Isolation Forest model
- `POST /api/models/price-anomaly` - Run Z-Score price analysis
- `POST /api/models/text-anomaly` - Run TF-IDF text analysis
- `POST /api/models/run-all` - Run all three models

### Data Management

- `POST /api/data/import` - Import CSV data (tenders/contracts/market_prices)
- `POST /api/data/generate-ppip` - Generate synthetic procurement data
- `POST /api/data/generate-market-prices` - Generate synthetic market prices

### Evaluation

- `POST /api/evaluation/evaluate` - Get model performance metrics with SHAP analysis

### Health

- `GET /health` - Health check endpoint
- `GET /` - API information

## Example Requests

### Run Process Anomaly Detection

```bash
curl -X POST http://localhost:8000/api/models/process-anomaly \
  -H "Content-Type: application/json"
```

### Import CSV Data

```bash
curl -X POST http://localhost:8000/api/data/import \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "tenders",
    "csvContent": "tender_id,procuring_entity,...",
    "clearExisting": false
  }'
```

### Evaluate Models

```bash
curl -X POST http://localhost:8000/api/evaluation/evaluate \
  -H "Content-Type: application/json"
```

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Supabase database connection
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
├── .env.example         # Example environment file
└── routers/
    ├── __init__.py
    ├── models.py        # ML model endpoints
    ├── data.py          # Data import/generation endpoints
    └── evaluation.py    # Model evaluation endpoints
```

## Frontend Integration

The frontend automatically connects to the Python backend at `http://localhost:8000`.

Make sure both servers are running:

1. **Python Backend**: `cd backend && python main.py` (port 8000)
2. **Frontend**: `npm run dev` (port 5173)

## Model Details

### 1. Isolation Forest (Process Anomaly)

**Library**: `sklearn.ensemble.IsolationForest`

**Features**:
- tender_duration_days
- number_of_bidders
- procurement_method (encoded)

**Parameters**:
- n_estimators: 100
- contamination: 0.1
- random_state: 42

### 2. Z-Score Analysis (Price Anomaly)

**Libraries**: `scipy.stats`, `pandas`

**Method**:
- Calculates mean and standard deviation from market prices
- Computes Z-scores for each contract item
- Flags items with |Z-score| > 2.5

### 3. TF-IDF + Cosine Similarity (Text Anomaly)

**Libraries**: `sklearn.feature_extraction.text.TfidfVectorizer`, `sklearn.metrics.pairwise.cosine_similarity`

**Features**:
- Detects brand bias in specifications
- Identifies similar tenders (potential collusion)
- Similarity threshold: 0.85

### 4. Model Evaluation

**Metrics**: Accuracy, Precision, Recall, F1 Score, Confusion Matrix

**Feature Importance**: Statistical comparison of feature distributions between anomalous and normal samples

**SHAP-like Analysis**: Calculates feature contributions relative to baseline averages

## Troubleshooting

### Import Error: No module named 'X'

```bash
pip install -r requirements.txt
```

### Port Already in Use

Change the port in `.env`:

```
API_PORT=8001
```

### CORS Errors

CORS is configured to allow all origins (`*`). If you need to restrict origins, modify `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Specific origins
    ...
)
```

### Database Connection Issues

Verify your Supabase credentials in `.env` are correct:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

## Testing

You can test the API using:

1. **Swagger UI**: http://localhost:8000/docs (interactive testing)
2. **curl**: Command-line requests
3. **Python requests library**: Automated testing

Example test script:

```python
import requests

# Test health endpoint
response = requests.get('http://localhost:8000/health')
print(response.json())

# Run process anomaly detection
response = requests.post('http://localhost:8000/api/models/process-anomaly')
print(response.json())
```

## Development

### Adding New Endpoints

1. Create/modify router files in `routers/`
2. Import and include router in `main.py`
3. Test using Swagger UI

### Adding New ML Models

1. Add endpoint in `routers/models.py`
2. Import required libraries
3. Connect to database using `get_db()`
4. Store results in `audit_results` table

## Performance

- **Isolation Forest**: O(n log n) - Fast for 1000s of records
- **Z-Score Analysis**: O(n) - Very fast statistical computation
- **TF-IDF**: O(n²) for similarity - Can be slow for >10,000 tenders

For large datasets (>100k records), consider:
- Batch processing
- Caching with Redis
- Database indexing
- Asynchronous processing with Celery

## License

MIT License - see project root for details
