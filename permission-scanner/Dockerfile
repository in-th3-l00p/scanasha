FROM python:3.10-slim

WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install solc for slither
RUN apt-get update && \
    apt-get install -y git build-essential && \
    pip install solc-select && \
    solc-select install 0.8.20 && \
    solc-select use 0.8.20 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 3002

# Command to run the application
CMD ["python", "api.py"] 