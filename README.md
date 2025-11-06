# AI Auditor - Procurement Anomaly Detection System

A comprehensive AI-powered system for detecting corruption and irregularities in public procurement processes using machine learning and statistical analysis.

![System Architecture](https://img.shields.io/badge/Stack-React%20%7C%20Python%20%7C%20SQLite-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [AI Models](#ai-models)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Data Import](#data-import)
- [Model Evaluation](#model-evaluation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The AI Auditor is an intelligent procurement monitoring system designed to automatically detect potential corruption, fraud, and irregularities in public procurement processes. It uses three complementary machine learning models to analyze tenders from multiple perspectives:

1. **Process Anomaly Detection** - Identifies procedural irregularities
2. **Price Anomaly Detection** - Flags unusual pricing patterns
3. **Text Analysis** - Detects bias and collusion in tender documents

### Why This Matters

- **Transparency**: Increases accountability in public spending
- **Efficiency**: Automates audit processes that would take months manually
- **Cost Savings**: Identifies overpricing and prevents wasteful spending
- **Evidence-Based**: Provides clear explanations for flagged anomalies
- **Scalable**: Can analyze thousands of tenders in minutes

### Target Users

- Government auditors and oversight bodies
- Anti-corruption agencies
- Procurement officers
- Transparency NGOs
- Investigative journalists
- Academic researchers

---

## Features

### 🎯 Core Capabilities

- **Multi-Model Analysis**: Three independent AI models working together
- **Real-Time Detection**: Instant anomaly flagging as data is uploaded
- **Explainable AI**: Human-readable explanations for every flag
- **Interactive Dashboard**: Visual analytics and statistics
- **Detailed Reports**: Export audit results with evidence
- **Batch Processing**: Handle large datasets efficiently

### 📊 Anomaly Detection

#### Process Anomalies
- Unusually short tender durations
- Limited number of bidders
- Restricted tender methods
- Suspicious timing patterns

#### Price Anomalies
- Prices significantly above market rates
- Unusually low prices (potential quality issues)
- Statistical outliers (Z-score analysis)
- Market comparison with confidence scores

#### Text Anomalies
- Brand-specific requirements (bias)
- Suspiciously similar tender documents (collusion)
- Restrictive technical specifications
- Copy-paste patterns across tenders

### 🎨 User Interface

- **Dashboard**: Overview of all tenders and anomaly statistics
- **Tender List**: Browse and filter tenders (all/flagged)
- **Tender Details**: Deep dive into individual tenders with AI analysis
- **Model Evaluation**: Performance metrics and model transparency
- **Data Upload**: CSV import with validation
- **Pipeline Control**: Generate test data and run models

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Dashboard   │  │ Tender List  │  │   Details    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Data Upload  │  │  Evaluation  │  │   Pipeline   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Router Layer                        │   │
│  │  /api/data  │  /api/models  │  /api/evaluation       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Machine Learning Layer                     │   │
│  │  Isolation Forest │ Z-Score │ TF-IDF/Cosine Sim      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Access Layer                       │   │
│  │  TenderDB │ ContractDB │ AuditResultDB │ MarketDB    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   SQLite Database                           │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐   │
│  │ Tenders │  │Contracts │  │ Audit Results│  │ Market  │   │
│  └─────────┘  └──────────┘  └──────────────┘  └─────────┘   │  
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User uploads CSV** → Frontend validates → Backend imports
2. **User triggers pipeline** → Backend generates synthetic data
3. **User runs models** → ML models analyze data → Results stored
4. **User views dashboard** → Frontend fetches data → Displays insights
5. **User clicks tender** → Detailed view with all anomalies explained

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Python 3.9+** - Programming language
- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **SQLite3** - Embedded database

### Machine Learning
- **scikit-learn** - ML algorithms (Isolation Forest, TF-IDF)
- **pandas** - Data manipulation
- **numpy** - Numerical computing
- **scipy** - Statistical analysis (Z-scores)

### Development Tools
- **ESLint** - JavaScript linting
- **TypeScript ESLint** - TypeScript linting
- **Autoprefixer** - CSS processing
- **PostCSS** - CSS transformations

---

## Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.9 or higher)
- **pip** (Python package manager)
- **Git** (optional)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd project
```

### Step 2: Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cat > .env << EOF
VITE_PYTHON_API_URL=http://localhost:8000
EOF
```

### Step 3: Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file (optional - has defaults)
cat > .env << EOF
API_HOST=0.0.0.0
API_PORT=8000
EOF
```

### Step 4: Verify Installation

```bash
# Check Python packages
pip list

# Check Node packages
npm list --depth=0
```

---

## Usage Guide

### Starting the Application

#### Terminal 1: Backend

```bash
cd backend
source venv/bin/activate
python main.py
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Terminal 2: Frontend

```bash
npm run dev
```

Expected output:
```
  VITE v5.4.8  ready in 423 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### First-Time Setup

1. **Open browser** to `http://localhost:5173`
2. **Navigate to "Pipeline"** tab
3. **Click "Generate Test Data"** to create sample tenders
4. **Click "Generate Market Prices"** to create price benchmarks
5. **Click "Run All Models"** to analyze the data
6. **View results** in Dashboard and Tenders tabs

### Working with Real Data

#### Preparing CSV Files

**Tenders CSV Format:**
```csv
tender_id,procuring_entity,tender_title,category,procurement_method,tender_duration_days,number_of_bidders,tender_description,technical_specs
TND-001,Ministry of Health,Medical Equipment,Medical Supplies,Open,30,5,Supply of medical equipment,Standard WHO specifications
```

Required columns:
- `tender_id` - Unique identifier
- `procuring_entity` - Organization name
- `tender_title` - Title of tender
- `category` - Category (IT Equipment, Medical Supplies, etc.)
- `procurement_method` - Either "Open" or "Restricted"
- `tender_duration_days` - Integer > 0
- `number_of_bidders` - Integer >= 0
- `tender_description` - Text description
- `technical_specs` - Optional specifications

**Contracts CSV Format:**
```csv
contract_id,tender_id,supplier_name,item_description,unit_price,quantity
CNT-001,TND-001,ABC Ltd,Laptop Computer,75000,10
```

Required columns:
- `contract_id` - Unique identifier
- `tender_id` - Links to tender
- `supplier_name` - Supplier name
- `item_description` - Item name
- `unit_price` - Price per unit (positive number)
- `quantity` - Number of units (positive integer)

**Market Prices CSV Format:**
```csv
item_name,category,unit_price,source
Laptop Computer,IT Equipment,65000,Jumia Kenya
```

Required columns:
- `item_name` - Item name
- `category` - Category
- `unit_price` - Market price (positive number)
- `source` - Data source

#### Uploading Data

1. Go to **Data Upload** tab
2. Select data type (Tenders, Contracts, or Market Prices)
3. Choose CSV file
4. Enable "Clear existing data" if needed
5. Click **Upload**
6. Check validation results

### Running Analysis

#### Option 1: Full Pipeline
1. Go to **Pipeline** tab
2. Click **"Run Full Pipeline"**
3. Wait for completion (generates data + runs all models)

#### Option 2: Individual Models
1. **Process Model** - Analyze procedural anomalies
2. **Price Model** - Analyze pricing patterns
3. **Text Model** - Analyze tender text for bias/collusion

Each model provides:
- Number of anomalies detected
- Processing time
- Success confirmation

### Understanding Results

#### Dashboard View

**Key Metrics:**
- Total tenders analyzed
- Total anomalies found
- Anomaly rate percentage
- Contracts analyzed

**Visualizations:**
- Tenders by Category (pie chart)
- Risk Distribution Web (radar chart)
- Top Risky Entities (bar chart)

#### Tender List View

**All Tenders:**
- Shows every tender with basic info
- Green checkmark = No issues
- Red warning = Anomalies detected

**Flagged Tenders:**
- Only shows tenders with anomalies
- Displays number of flags per tender

**Tender Cards Show:**
- Tender ID and title
- Procuring entity
- Category and method
- Duration and bidder count
- Anomaly status

#### Tender Details View

Opens when you click "Details" on any tender.

**Information Sections:**

1. **Header**
   - Tender ID and title
   - Flagged status
   - Procuring entity

2. **Basic Info Cards**
   - Category
   - Procurement method
   - Duration in days
   - Number of bidders

3. **Descriptions**
   - Full tender description
   - Technical specifications

4. **AI Audit Results**

   **Process Risk Analysis** (Red section)
   - Shows procedural anomalies
   - Example: "Very short duration (10 days) | Low competition (2 bidders)"

   **Text Risk Analysis** (Purple section)
   - Shows text-based anomalies
   - Example: "Brand bias detected: dell, hp"

   **Contracts & Price Analysis** (Per contract)
   - Contract details
   - Price anomalies with context
   - Example: "Price 45.2% ABOVE market average. Potential overpayment of KES 125,000"

---

## AI Models

### 1. Process Anomaly Detector (Isolation Forest)

**Algorithm**: Isolation Forest (scikit-learn)

**Purpose**: Detect procedural irregularities in procurement processes

**Input Features**:
- `tender_duration_days` - Length of tender period
- `number_of_bidders` - Competition level
- `procurement_method` - Open vs Restricted

**How It Works**:
1. Trains on all tenders to learn normal patterns
2. Isolates anomalies by measuring how different they are
3. Assigns anomaly score (-1 for anomaly, 1 for normal)

**Flags**:
- Duration < 14 days (rushed procurement)
- ≤ 2 bidders (limited competition)
- Restricted method (reduced transparency)

**Configuration**:
```python
IsolationForest(
    n_estimators=100,      # Number of trees
    contamination=0.1,     # Expected anomaly rate (10%)
    random_state=42,       # Reproducibility
    max_samples='auto'     # Sample size per tree
)
```

**Output**:
- Binary flag (anomaly/normal)
- Anomaly score (higher = more anomalous)
- Human-readable explanation

**Example Output**:
```
Anomaly: True
Score: 0.87
Explanation: "Very short duration (8 days) | Low competition (1 bidder) | Restricted tender method"
```

### 2. Price Anomaly Detector (Z-Score Analysis)

**Algorithm**: Statistical Z-Score with market comparison

**Purpose**: Detect overpricing and unusual pricing patterns

**How It Works**:
1. Normalizes item names (removes special characters)
2. Calculates market statistics per item type
3. Computes Z-score: `(price - mean) / std_dev`
4. Flags if |Z-score| > 2.5 (99% confidence)

**Data Flow**:
```
Contract Price → Compare with Market → Calculate Z-Score → Flag if anomalous
```

**Thresholds**:
- Z-score > 2.5: Price significantly ABOVE market
- Z-score < -2.5: Price significantly BELOW market

**Output**:
- Anomaly flag
- Z-score
- Percentage difference from market
- Potential overpayment amount

**Example Output**:
```
Anomaly: True
Z-Score: 3.45
Explanation: "Price 45.2% ABOVE market average (Z-score: 3.45).
              Potential overpayment of KES 125,000"
```

**Benefits**:
- Market-aware pricing analysis
- Quantified overpayment estimates
- Statistical confidence levels

### 3. Text Anomaly Detector (NLP)

**Algorithm**: TF-IDF + Cosine Similarity

**Purpose**: Detect bias and collusion in tender documents

**Techniques Used**:

1. **Brand Bias Detection**
   - Searches for brand-specific keywords
   - Brands: Dell, HP, Microsoft, Toyota, etc.
   - Indicates potentially rigged specifications

2. **Collusion Detection**
   - Converts text to TF-IDF vectors
   - Computes pairwise similarity
   - Flags tenders with >85% similarity

**Configuration**:
```python
TfidfVectorizer(
    max_features=500,        # Top 500 words
    stop_words='english',    # Remove common words
    ngram_range=(1, 2)       # Single words and pairs
)
```

**Red Flags**:
- Brand names in specifications
- Copy-paste tender descriptions
- Suspiciously similar documents

**Output**:
- Anomaly flag
- Detected brands (if any)
- Similar tenders (if any)
- Confidence score

**Example Output**:
```
Anomaly: True
Explanation: "Brand bias detected: dell, hp |
              High similarity to 2 other tenders: TND-002, TND-005"
```

### Model Complementarity

The three models work together:

| Model | Detects | Catches |
|-------|---------|---------|
| Process | Procedural issues | Rushed tenders, limited competition |
| Price | Financial issues | Overpricing, suspicious pricing |
| Text | Document issues | Bias, collusion, rigging |

A tender flagged by **multiple models** has higher corruption risk.

---

## API Reference

### Base URL
```
http://localhost:8000
```

### Authentication
No authentication required (local use).

---

### Data Endpoints

#### Get All Tenders
```http
GET /api/data/tenders
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "tender_id": "TND-2024-00001",
      "procuring_entity": "Ministry of Health",
      "tender_title": "Medical Equipment",
      "category": "Medical Supplies",
      "procurement_method": "Open",
      "tender_duration_days": 30,
      "number_of_bidders": 5,
      "tender_description": "Supply of medical equipment",
      "technical_specs": "WHO standard",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

#### Get All Contracts
```http
GET /api/data/contracts
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "contract_id": "CNT-2024-00001",
      "tender_id": "TND-2024-00001",
      "supplier_name": "ABC Medical Ltd",
      "item_description": "Stethoscope",
      "unit_price": 3500,
      "quantity": 100,
      "total_value": 350000,
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

#### Get All Audit Results
```http
GET /api/data/audit-results
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "tender_id": "TND-2024-00001",
      "contract_id": null,
      "model_type": "process",
      "is_anomaly": true,
      "anomaly_score": 0.87,
      "explanation": "Short duration (10 days) | Low competition (2 bidders)",
      "created_at": "2024-01-15T11:00:00"
    }
  ]
}
```

#### Import Data
```http
POST /api/data/import
Content-Type: application/json
```

**Request Body**:
```json
{
  "dataType": "tenders",
  "csvContent": "tender_id,procuring_entity,...\nTND-001,Ministry,...",
  "clearExisting": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully imported 50 tenders records",
  "imported": 50,
  "skipped": 2,
  "errors": ["Row 3: Invalid procurement_method"]
}
```

#### Generate Test Tenders
```http
POST /api/data/generate-ppip?count=50
```

**Response**:
```json
{
  "success": true,
  "message": "Generated 50 tenders and contracts"
}
```

#### Generate Market Prices
```http
POST /api/data/generate-market-prices?count=1000
```

**Response**:
```json
{
  "success": true,
  "message": "Generated 1000 market price records"
}
```

---

### Model Endpoints

#### Run Process Anomaly Model
```http
POST /api/models/process-anomaly
```

**Response**:
```json
{
  "success": true,
  "message": "Processed 50 tenders, found 5 anomalies",
  "total_processed": 50,
  "anomalies_found": 5
}
```

#### Run Price Anomaly Model
```http
POST /api/models/price-anomaly
```

**Response**:
```json
{
  "success": true,
  "message": "Analyzed 120 contracts, found 8 price anomalies",
  "total_processed": 120,
  "anomalies_found": 8
}
```

#### Run Text Anomaly Model
```http
POST /api/models/text-anomaly
```

**Response**:
```json
{
  "success": true,
  "message": "Analyzed 50 tenders, found 3 text anomalies",
  "total_processed": 50,
  "anomalies_found": 3
}
```

#### Run All Models
```http
POST /api/models/run-all
```

**Response**:
```json
{
  "success": true,
  "message": "All models executed successfully",
  "results": {
    "process": { "anomalies_found": 5 },
    "price": { "anomalies_found": 8 },
    "text": { "anomalies_found": 3 }
  }
}
```

---

### Evaluation Endpoint

#### Evaluate Models
```http
POST /api/evaluation/evaluate
```

**Response**:
```json
{
  "success": true,
  "evaluation": {
    "processModel": {
      "name": "Isolation Forest (Process Anomaly Detector)",
      "metrics": {
        "accuracy": 0.85,
        "precision": 0.78,
        "recall": 0.82,
        "f1Score": 0.80,
        "truePositives": 41,
        "trueNegatives": 890,
        "falsePositives": 12,
        "falseNegatives": 9
      },
      "featureImportance": [
        {
          "feature": "number_of_bidders",
          "importance": 45.2,
          "description": "Avg anomalous: 1.8 vs normal: 4.5"
        }
      ]
    },
    "shapAnalysis": {
      "sampleTenderId": "TND-001",
      "values": [
        {
          "feature": "tender_duration_days",
          "shapValue": -0.45,
          "contribution": "Increases anomaly score"
        }
      ]
    }
  }
}
```

---

### Health Check

#### Health Endpoint
```http
GET /health
```

**Response**:
```json
{
  "status": "healthy"
}
```

---

## Database Schema

### Tables

#### `tenders`
Stores procurement tender information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| tender_id | TEXT | UNIQUE, NOT NULL | Tender identifier |
| procuring_entity | TEXT | NOT NULL | Organization name |
| tender_title | TEXT | NOT NULL | Tender title |
| category | TEXT | NOT NULL | Category |
| procurement_method | TEXT | NOT NULL | Open/Restricted |
| tender_duration_days | INTEGER | NOT NULL | Duration in days |
| number_of_bidders | INTEGER | NOT NULL | Bidder count |
| tender_description | TEXT | NOT NULL | Description |
| technical_specs | TEXT | NULL | Specifications |
| created_at | TIMESTAMP | DEFAULT NOW | Creation time |

**Indexes**: None (small dataset)

---

#### `contracts`
Stores contract/line item details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| contract_id | TEXT | UNIQUE, NOT NULL | Contract identifier |
| tender_id | TEXT | NOT NULL, FK | Links to tender |
| supplier_name | TEXT | NOT NULL | Supplier name |
| item_description | TEXT | NOT NULL | Item name |
| unit_price | REAL | NOT NULL | Price per unit |
| quantity | INTEGER | NOT NULL | Number of units |
| total_value | REAL | NOT NULL | Total cost |
| created_at | TIMESTAMP | DEFAULT NOW | Creation time |

**Indexes**:
- `idx_contract_tender` on `tender_id`

**Foreign Keys**:
- `tender_id` → `tenders(tender_id)`

---

#### `market_prices`
Stores market benchmark prices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| item_name | TEXT | NOT NULL | Item name |
| category | TEXT | NOT NULL | Category |
| unit_price | REAL | NOT NULL | Market price |
| source | TEXT | NOT NULL | Data source |
| created_at | TIMESTAMP | DEFAULT NOW | Creation time |

**Indexes**: None

---

#### `audit_results`
Stores AI model analysis results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment ID |
| tender_id | TEXT | NOT NULL, FK | Links to tender |
| contract_id | TEXT | NULL | Optional contract link |
| model_type | TEXT | NOT NULL | process/price/text |
| is_anomaly | BOOLEAN | NOT NULL | True if flagged |
| anomaly_score | REAL | NULL | Confidence score |
| explanation | TEXT | NOT NULL | Human explanation |
| created_at | TIMESTAMP | DEFAULT NOW | Creation time |

**Indexes**:
- `idx_tender_id` on `tender_id`

**Foreign Keys**:
- `tender_id` → `tenders(tender_id)`

---

### Database File

**Location**: `backend/procurement.db`

**Tools to View**:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQLite Viewer](https://inloop.github.io/sqlite-viewer/)
- Command line: `sqlite3 backend/procurement.db`

**Backup**:
```bash
cp backend/procurement.db backup/procurement_$(date +%Y%m%d).db
```

**Reset**:
```bash
rm backend/procurement.db
# Will be recreated on next backend start
```

---

## Data Import

### CSV Validation Rules

#### Tenders
- `tender_id`: Cannot be empty
- `tender_duration_days`: Must be positive integer
- `number_of_bidders`: Must be non-negative integer
- `procurement_method`: Must be "Open" or "Restricted"

#### Contracts
- `contract_id`: Cannot be empty
- `unit_price`: Must be positive number
- `quantity`: Must be positive integer
- `tender_id`: Must exist in tenders table

#### Market Prices
- `unit_price`: Must be positive number
- All fields required

### Error Handling

Invalid rows are skipped and reported:

```json
{
  "imported": 48,
  "skipped": 2,
  "errors": [
    "Row 15: tender_duration_days must be positive",
    "Row 23: procurement_method must be 'Open' or 'Restricted'"
  ]
}
```

### Best Practices

1. **Clean your data first**
   - Remove duplicates
   - Standardize formats
   - Validate values

2. **Start small**
   - Test with 10-20 records
   - Check for errors
   - Then upload full dataset

3. **Use consistent IDs**
   - Sequential: TND-001, TND-002
   - Year-based: TND-2024-001
   - Avoid special characters

4. **Match tender_id and contract_id**
   - Contracts must reference existing tenders
   - Upload tenders first, then contracts

---

## Model Evaluation

### Metrics Explained

#### Accuracy
Percentage of correct predictions (anomaly or normal).

```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
```

#### Precision
Of all flagged tenders, how many are actually anomalous?

```
Precision = TP / (TP + FP)
```

High precision = Few false alarms

#### Recall
Of all actual anomalies, how many did we detect?

```
Recall = TP / (TP + FN)
```

High recall = Few missed anomalies

#### F1 Score
Harmonic mean of precision and recall.

```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```

Balanced measure of both metrics.

### Confusion Matrix

```
                 Predicted
                 Normal  Anomaly
Actual  Normal    TN      FP
        Anomaly   FN      TP
```

- **TN (True Negative)**: Correctly identified normal tenders
- **FP (False Positive)**: Incorrectly flagged normal tenders
- **FN (False Negative)**: Missed actual anomalies
- **TP (True Positive)**: Correctly identified anomalies

### Feature Importance

Shows which features matter most for predictions.

Example:
```json
{
  "feature": "number_of_bidders",
  "importance": 45.2,
  "description": "Avg anomalous: 1.8 bidders vs normal: 4.5 bidders"
}
```

Interpretation: Bidder count is the strongest anomaly indicator.

### SHAP Analysis

Shows how each feature contributes to a specific prediction.

Example:
```json
{
  "feature": "tender_duration_days",
  "shapValue": -0.45,
  "contribution": "Increases anomaly score"
}
```

Negative SHAP value + "increases score" = Low duration increases anomaly likelihood.

---

## Deployment

### Production Deployment

#### Option 1: Single Server

```bash
# Backend (with gunicorn)
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app

# Frontend (build static files)
npm run build
# Serve dist/ folder with nginx or apache
```

#### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.9
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t ai-auditor .
docker run -p 8000:8000 ai-auditor
```

#### Option 3: Cloud Platforms

**Render / Railway / Fly.io**:
- Deploy backend as web service
- Deploy frontend as static site
- Connect via environment variables

### Security Considerations

⚠️ **This application is designed for internal use**

For production:
1. Add authentication (JWT, OAuth)
2. Enable HTTPS
3. Set up CORS properly
4. Use environment variables for secrets
5. Implement rate limiting
6. Add input sanitization
7. Enable database backups
8. Monitor logs and errors

### Performance Optimization

1. **Database**
   - Add indexes on frequently queried columns
   - Use connection pooling
   - Consider PostgreSQL for large datasets

2. **Backend**
   - Cache model results
   - Use async processing for large batches
   - Implement pagination

3. **Frontend**
   - Code splitting
   - Lazy loading components
   - Memoize expensive computations

---

## Troubleshooting

### Common Issues

#### Backend won't start

**Issue**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

---

**Issue**: `Address already in use`

**Solution**:
```bash
# Find process on port 8000
lsof -ti:8000 | xargs kill -9

# Or change port
export API_PORT=8001
python main.py
```

---

#### Frontend can't connect

**Issue**: Network error when loading data

**Solution**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Check `.env` file exists with: `VITE_PYTHON_API_URL=http://localhost:8000`
3. Restart frontend: `npm run dev`

---

#### Models return no anomalies

**Issue**: All tenders show as "Clear"

**Possible causes**:
1. No data uploaded yet → Upload or generate data
2. Data is too uniform → Models need variety to detect outliers
3. Contamination rate too low → Adjust in model code

---

#### Database errors

**Issue**: `database is locked`

**Solution**:
```bash
# Stop all processes
pkill -f "python main.py"
pkill -f "npm run dev"

# Restart backend first, then frontend
```

---

**Issue**: Corrupted database

**Solution**:
```bash
cd backend
rm procurement.db
# Database will be recreated on next start
python main.py
```

---

### Debug Mode

Enable detailed logging:

**Backend**:
```bash
export LOG_LEVEL=DEBUG
python main.py
```

**Frontend**:
```bash
# Check browser console (F12)
# Network tab shows API requests/responses
```

---

## Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature-name`
6. Open Pull Request

### Code Style

**Python**:
- Follow PEP 8
- Use type hints
- Write docstrings

**TypeScript/React**:
- Use ESLint rules
- Follow React best practices
- Write meaningful component names

### Testing

```bash
# Backend tests (when available)
pytest backend/tests/

# Frontend tests (when available)
npm test

# Type checking
npm run typecheck
```

---

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Acknowledgments

- **scikit-learn** - Machine learning library
- **FastAPI** - Modern Python web framework
- **React** - Frontend framework
- **Tailwind CSS** - Styling framework
- **Recharts** - Charting library

---

## Support

For questions, issues, or suggestions:

- Create an issue on GitHub
- Email: [your-email]
- Documentation: [link-to-docs]

---

## Roadmap

### Planned Features

- [ ] Real-time monitoring dashboard
- [ ] Email alerts for high-risk tenders
- [ ] Export reports to PDF
- [ ] Advanced filtering and search
- [ ] Historical trend analysis
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Integration with procurement systems
- [ ] Advanced NLP (BERT, GPT)
- [ ] Network analysis (detect cartels)

### Version History

**v1.0.0** (Current)
- Initial release
- Three AI models
- SQLite database
- Web interface
- CSV import/export

---

**Built with ❤️ for transparency in public procurement**
