from flask import Flask, request, jsonify
import os
import json
import tempfile
import subprocess
from pathlib import Path

app = Flask(__name__)

# Get the base directory of the permission scanner
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/scan', methods=['POST'])
def scan_contract():
    data = request.json
    
    # Validate input data
    if not data or 'contract_name' not in data or 'contract_address' not in data:
        return jsonify({'error': 'Missing required fields: contract_name and contract_address'}), 400
    
    contract_name = data['contract_name']
    contract_address = data['contract_address']
    
    # Check if the implementation_name is provided for proxy contracts
    implementation_name = data.get('implementation_name')
    
    # Create a temporary contracts.json file
    contracts_json = {
        "Chain_Name": "mainnet",
        "Project_Name": "scanasha",
        "Contracts": []
    }
    
    # Add the contract to the contracts list
    contract_entry = {
        "name": contract_name,
        "address": contract_address
    }
    
    # Add implementation name if provided
    if implementation_name:
        contract_entry["implementation_name"] = implementation_name
    
    contracts_json["Contracts"].append(contract_entry)
    
    # Write the contracts.json file
    contracts_file_path = os.path.join(BASE_DIR, 'contracts.json')
    with open(contracts_file_path, 'w') as f:
        json.dump(contracts_json, f, indent=2)
    
    try:
        # Run the permission scanner script
        result = subprocess.run(
            ['python', os.path.join(BASE_DIR, 'src', 'main.py')],
            check=True,
            cwd=BASE_DIR  # Set the working directory to the base dir
        )
        
        # Check if permissions.json was generated
        permissions_file_path = os.path.join(BASE_DIR, 'permissions.json')
        if not os.path.exists(permissions_file_path):
            return jsonify({'error': 'Failed to generate permissions.json'}), 500
        
        # Read and return the permissions.json file
        with open(permissions_file_path, 'r') as f:
            permissions = json.load(f)
        
        return jsonify(permissions)
    
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'Error running permission scanner: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'base_dir': BASE_DIR}), 200

if __name__ == '__main__':
    # Make sure we're running from the correct directory
    os.chdir(BASE_DIR)
    app.run(host='0.0.0.0', port=3002) 