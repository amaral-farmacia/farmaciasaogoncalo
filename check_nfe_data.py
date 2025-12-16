#!/usr/bin/env python3

import requests
import sys

def check_nfe_data():
    base_url = "https://pharmatrack-44.preview.emergentagent.com/api"
    
    # Login first
    login_response = requests.post(f"{base_url}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if login_response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get NFe list
    nfe_response = requests.get(f"{base_url}/notas-fiscais", headers=headers)
    
    if nfe_response.status_code != 200:
        print("❌ Failed to get NFe list")
        return
    
    notas = nfe_response.json()
    print(f"📄 Found {len(notas)} NFes in database:")
    
    expected_samples = ["000123456", "000789012"]
    found_samples = []
    
    for nota in notas:
        print(f"   - NFe {nota['numero']}/{nota['serie']}: {nota['fornecedor_nome']}")
        print(f"     Status: {nota['status']} | Valor: R$ {nota['valor_total']}")
        
        if nota['numero'] in expected_samples:
            found_samples.append(nota['numero'])
    
    print(f"\n📊 Sample data status:")
    for sample in expected_samples:
        if sample in found_samples:
            print(f"   ✅ Sample NFe {sample} found")
        else:
            print(f"   ❌ Sample NFe {sample} missing")
    
    print(f"\nSample NFes found: {len(found_samples)}/2")

if __name__ == "__main__":
    check_nfe_data()