#!/usr/bin/env python3

import base64
import json
import requests
from io import BytesIO
from PIL import Image

def test_image_processing():
    # Read and encode image
    with open('/Users/abhinav/Downloads/WA-upi.PNG', 'rb') as f:
        image_bytes = f.read()
        image_b64 = base64.b64encode(image_bytes).decode()
    
    print(f"Original image size: {len(image_bytes)} bytes")
    print(f"Base64 length: {len(image_b64)}")
    
    # Test PIL directly
    try:
        img = Image.open(BytesIO(image_bytes))
        print(f"PIL direct: {img.format}, {img.size}, {img.mode}")
    except Exception as e:
        print(f"PIL direct error: {e}")
    
    # Test decode from base64
    try:
        decoded = base64.b64decode(image_b64)
        img = Image.open(BytesIO(decoded))
        print(f"PIL from base64: {img.format}, {img.size}, {img.mode}")
    except Exception as e:
        print(f"PIL from base64 error: {e}")
    
    # Test API request
    payload = {
        'image_base64': image_b64,
        'match_date': '2024-01-15T00:00:00Z'
    }
    
    try:
        response = requests.post('http://localhost:8010/parse-payment', json=payload)
        result = response.json()
        print(f"API Success: {result.get('success')}")
        print(f"API Error: {result.get('error_message')}")
        
        if result.get('success'):
            data = result.get('data', {})
            metadata = result.get('metadata', {})
            print(f"\n🎉 PAYMENT PARSED SUCCESSFULLY!")
            print(f"Amount: {data.get('amount')} {data.get('currency')}")
            print(f"Payer: {data.get('payer_name')}")
            print(f"Payee: {data.get('payee_name')}")
            print(f"Date: {data.get('date')}")
            print(f"Time: {data.get('time')}")
            print(f"Transaction ID: {data.get('transaction_id')}")
            print(f"Payment Method: {data.get('payment_method')}")
            print(f"UPI ID: {data.get('upi_id')}")
            print(f"Confidence: {metadata.get('confidence')}")
            print(f"Model: {metadata.get('model')}")
            print(f"Model Cost Tier: {metadata.get('model_cost_tier')}")
            print(f"Image Hash: {metadata.get('image_hash')}")
            print(f"Processing Time: {metadata.get('processing_time_ms')}ms")
        else:
            print(f"Full error response: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"API request error: {e}")

if __name__ == "__main__":
    test_image_processing()
