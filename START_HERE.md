# AI Auditor - Quick Start Guide

Your application now uses **SQLite local database** with Python for all backend operations.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────┐
│   React App     │ ───────>│  Python FastAPI  │ ───────>│   SQLite   │
│  (Port 5173)    │  HTTP   │   (Port 8000)    │   SQL   │  Local DB  │
└─────────────────┘         └──────────────────┘         └────────────┘
     Frontend                    Backend                   Storage
```

##  What Changed?

✅ **Removed Supabase** - No more cloud database dependency
✅ **Added SQLite** - Fast, local, file-based database (`procurement.db`)
✅ **Python handles everything** - All data operations through Python API
✅ **Zero configuration** - Database created automatically on first run

## How to Start the Application

### Step 1: Start Python Backend

Open Terminal 1:

```bash
cd backend

# Setup (first time only)
./setup.sh
# OR manually:
# python3 -m venv venv
# source venv/bin/activate
# pip install -r requirements.txt

# Activate virtual environment
source venv/bin/activate

# Start server
python main.py
```

The Python backend will start at **http://localhost:8000**

API Documentation: http://localhost:8000/docs

### Step 2: Start Frontend

Open Terminal 2:

```bash
# Make sure you're in the project root
npm run dev
```

The frontend will start at **http://localhost:5173**

## Using the Application

1. **Generate Data** (optional):
   - Click "Run Full Pipeline" to generate synthetic procurement data
   - Or upload your own CSV data

2. **View Dashboard**:
   - See overview of tenders, anomalies, and statistics
   - All data stored in local SQLite database

3. **Browse Tenders**:
   - View all tenders or filter by flagged tenders
   - Click "Details" to see anomaly explanations

4. **Run Evaluation**:
   - Click "Run Evaluation" to get model metrics
   - See accuracy, precision, recall, F1 scores
   - View feature importance and SHAP analysis

## Database File Location

The SQLite database is stored at:
```
backend/procurement.db
```

You can:
- Open it with any SQLite browser (e.g., DB Browser for SQLite)
- Back it up by copying the file
- Delete it to start fresh (will be recreated on next run)

## Python Libraries Used

- **FastAPI** - Modern web framework for APIs
- **scikit-learn** - Machine learning (Isolation Forest, TF-IDF)
- **pandas** - Data manipulation and analysis
- **numpy** - Numerical computing
- **scipy** - Statistical analysis (Z-scores)
- **SQLite3** - Built-in Python database (no installation needed)

## Project Structure

```
project/
├── backend/                    # Python FastAPI Backend
│   ├── main.py                # Entry point
│   ├── database.py            # SQLite connection & models
│   ├── procurement.db         # SQLite database file (created automatically)
│   ├── requirements.txt       # Python dependencies (no Supabase)
│   ├── .env                   # Environment variables
│   ├── setup.sh               # Setup script
│   └── routers/
│       ├── models.py          # ML model endpoints
│       ├── data.py            # Data operations + fetch endpoints
│       └── evaluation.py      # Model evaluation
│
├── src/                       # React Frontend
│   ├── components/            # UI components
│   └── lib/
│       ├── api.ts            # Calls Python backend
│       └── database.ts       # Fetch data from Python API
│
└── .env                      # Frontend environment variables
    VITE_PYTHON_API_URL=http://localhost:8000
```

## API Endpoints (Python Backend)

### Data Fetching
- `GET /api/data/tenders` - Get all tenders
- `GET /api/data/contracts` - Get all contracts
- `GET /api/data/audit-results` - Get all audit results

### Models
- `POST /api/models/process-anomaly` - Run Isolation Forest
- `POST /api/models/price-anomaly` - Run Z-Score analysis
- `POST /api/models/text-anomaly` - Run TF-IDF analysis
- `POST /api/models/run-all` - Run all three models

### Data Operations
- `POST /api/data/import` - Import CSV data
- `POST /api/data/generate-ppip` - Generate test tenders
- `POST /api/data/generate-market-prices` - Generate market data

### Evaluation
- `POST /api/evaluation/evaluate` - Get model metrics with SHAP

### Health
- `GET /health` - Health check
- `GET /` - API info

## Advantages of SQLite

✅ **No setup required** - Works out of the box
✅ **Fast** - All data stored locally
✅ **Portable** - Single file database
✅ **Reliable** - Battle-tested and stable
✅ **No internet required** - Fully offline
✅ **Easy backup** - Just copy the .db file
✅ **Easy to inspect** - Use any SQLite browser tool

## Troubleshooting

### Python Backend Won't Start

**Issue**: "No module named 'fastapi'"
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**Issue**: "Port 8000 already in use"
```bash
# Find and kill the process using port 8000
lsof -ti:8000 | xargs kill -9
```

### Frontend Can't Connect to Backend

1. Check backend is running: http://localhost:8000/health
2. Check `.env` has: `VITE_PYTHON_API_URL=http://localhost:8000`
3. Restart frontend: `npm run dev`

### Database Issues

**Reset database**: Delete `backend/procurement.db` and restart Python backend

**View database**: Use [DB Browser for SQLite](https://sqlitebrowser.org/) to open `backend/procurement.db`

**Backup database**:
```bash
cp backend/procurement.db backend/procurement.backup.db
```

## Next Steps

1. ✅ Start Python backend
2. ✅ Start frontend
3. Run the pipeline or upload data
4. View results in Dashboard and Tenders tabs
5. Run model evaluation to see performance metrics
6. Review anomalies and explanations

---

**Everything runs locally! No cloud dependencies, no configuration needed.**
