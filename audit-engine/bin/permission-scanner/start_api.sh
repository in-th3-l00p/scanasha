#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Creating virtual environment and installing dependencies..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found. Please copy .env.example to .env and fill in your API keys."
    exit 1
fi

# Check if required environment variables are set
if [ -z "$ETHERSCAN_API_KEY" ] || [ -z "$MAINNET_RPC" ]; then
    echo "Error: ETHERSCAN_API_KEY and MAINNET_RPC must be set in .env file."
    exit 1
fi

# Start the Flask API
echo "Starting Permission Scanner API..."
python api.py 