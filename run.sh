#!/bin/bash

# File Import Metrics Dashboard - Run Script

echo "======================================"
echo "  File Import Metrics Dashboard"
echo "======================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Run the application
echo ""
echo "Starting server..."
echo "Dashboard available at: http://localhost:5000"
echo ""
python app.py
