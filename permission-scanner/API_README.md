# Permission Scanner API

This API provides a RESTful interface to the Permission Scanner tool, allowing you to analyze smart contracts for permissioned functions via HTTP requests.

## Setup

1. Create and activate a virtual Python environment:

```shell
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Copy the `.env.example` file to `.env` and fill in your RPC provider's URL and valid block explorer API key:

```shell
cp .env.example .env
```

Edit the `.env` file to include at minimum:
```
ETHERSCAN_API_KEY=your_etherscan_api_key
MAINNET_RPC=https://mainnet.infura.io/v3/your_infura_key
```

3. Load the environment variables:

```shell
source .env
```

## Running the API

Start the Flask server with:

```shell
python api.py
```

The API will be available at http://localhost:3002

## API Endpoints

### Health Check

```
GET /health
```

Returns a simple status response to verify the API is running.

### Scan Contract

```
POST /scan
```

Scans a smart contract for permissioned functions.

#### Request Body

```json
{
  "contract_name": "TokenContract",
  "contract_address": "0x1234567890abcdef1234567890abcdef12345678",
  "implementation_name": "TokenImplementation" // Optional, only for proxy contracts
}
```

#### Response

Returns the JSON output of the permission scanner containing all the identified permissioned functions and their respective permission owners.

## Example Request

Using `curl`:

```shell
curl -X POST http://localhost:3002/scan \
  -H "Content-Type: application/json" \
  -d '{
    "contract_name": "MyToken",
    "contract_address": "0x1234567890abcdef1234567890abcdef12345678"
  }'
```

## Notes

- The API always uses the Ethereum mainnet for scanning
- The project name is set to "scanasha" for all scans
- For proxy contracts, you must provide the `implementation_name` field
- The response may take some time as the tool needs to fetch and analyze the contract code 