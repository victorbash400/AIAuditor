#!/bin/bash

echo "🚀 Starting AI Auditor Python Backend..."
echo ""

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run:"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure it"
    exit 1
fi

source venv/bin/activate

echo "✅ Virtual environment activated"
echo "✅ Starting FastAPI server on http://localhost:8000"
echo ""
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""

python main.py
