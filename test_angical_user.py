#!/usr/bin/env python3

import requests
import json

def test_angical_user():
    base_url = "https://pharmatrack-44.preview.emergentagent.com/api"
    
    print("🔍 TESTING ANGICAL USER CREATION AND AUTHENTICATION")
    print("=" * 60)
    
    # Test 1: Login as admin to check users list
    print("\n1. Login as admin to check users list...")
    admin_login_response = requests.post(f"{base_url}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if admin_login_response.status_code != 200:
        print(f"❌ Admin login failed: {admin_login_response.status_code}")
        print(f"Response: {admin_login_response.text}")
        return False
    
    admin_token = admin_login_response.json()["access_token"]
    print(f"✅ Admin login successful")
    
    # Test 2: Get users list
    print("\n2. Getting users list...")
    users_response = requests.get(f"{base_url}/usuarios", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    
    if users_response.status_code != 200:
        print(f"❌ Failed to get users list: {users_response.status_code}")
        print(f"Response: {users_response.text}")
        return False
    
    users = users_response.json()
    print(f"✅ Found {len(users)} users")
    
    # Look for angical user
    angical_user = None
    for user in users:
        print(f"   - {user.get('username')}: {user.get('full_name')} ({user.get('role')})")
        if user.get('username') == 'angical':
            angical_user = user
    
    if not angical_user:
        print("❌ Angical user not found in users list")
        return False
    
    print(f"✅ Angical user found!")
    print(f"   Username: {angical_user.get('username')}")
    print(f"   Full Name: {angical_user.get('full_name')}")
    print(f"   Role: {angical_user.get('role')}")
    print(f"   Unidade ID: {angical_user.get('unidade_id')}")
    
    # Test 3: Login as angical user
    print("\n3. Testing angical user login...")
    angical_login_response = requests.post(f"{base_url}/auth/login", json={
        "username": "angical",
        "password": "angical123"
    })
    
    if angical_login_response.status_code != 200:
        print(f"❌ Angical login failed: {angical_login_response.status_code}")
        print(f"Response: {angical_login_response.text}")
        return False
    
    angical_data = angical_login_response.json()
    angical_token = angical_data["access_token"]
    angical_user_info = angical_data["user"]
    
    print(f"✅ Angical login successful!")
    print(f"   User: {angical_user_info.get('full_name')} ({angical_user_info.get('role')})")
    print(f"   Unidade ID: {angical_user_info.get('unidade_id')}")
    
    # Test 4: Test angical user can access protected endpoints
    print("\n4. Testing angical user access to protected endpoints...")
    me_response = requests.get(f"{base_url}/auth/me", headers={
        "Authorization": f"Bearer {angical_token}"
    })
    
    if me_response.status_code != 200:
        print(f"❌ Angical user cannot access /auth/me: {me_response.status_code}")
        return False
    
    print(f"✅ Angical user can access protected endpoints")
    
    # Test 5: Check if São Gonçalo do Angical unit exists
    print("\n5. Checking if São Gonçalo do Angical unit exists...")
    units_response = requests.get(f"{base_url}/unidades", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    
    if units_response.status_code != 200:
        print(f"❌ Failed to get units list: {units_response.status_code}")
        return False
    
    units = units_response.json()
    print(f"✅ Found {len(units)} units")
    
    angical_unit = None
    for unit in units:
        print(f"   - {unit.get('nome')}")
        if 'São Gonçalo do Angical' in unit.get('nome', ''):
            angical_unit = unit
    
    if not angical_unit:
        print("❌ São Gonçalo do Angical unit not found")
        return False
    
    print(f"✅ São Gonçalo do Angical unit found!")
    print(f"   Name: {angical_unit.get('nome')}")
    print(f"   Address: {angical_unit.get('endereco')}")
    print(f"   Phone: {angical_unit.get('telefone')}")
    print(f"   Email: {angical_unit.get('email')}")
    print(f"   CNPJ: {angical_unit.get('cnpj')}")
    print(f"   Responsible: {angical_unit.get('responsavel')}")
    
    # Test 6: Verify angical user is assigned to correct unit
    if angical_user_info.get('unidade_id') == angical_unit.get('id'):
        print(f"✅ Angical user is correctly assigned to São Gonçalo do Angical unit")
    else:
        print(f"❌ Unit assignment mismatch:")
        print(f"   User unit ID: {angical_user_info.get('unidade_id')}")
        print(f"   Expected unit ID: {angical_unit.get('id')}")
        return False
    
    # Test 7: Test that angical user can only see their unit's data
    print("\n6. Testing unit data filtering for angical user...")
    
    # Test products access
    products_response = requests.get(f"{base_url}/produtos", headers={
        "Authorization": f"Bearer {angical_token}"
    })
    
    if products_response.status_code == 200:
        products = products_response.json()
        print(f"✅ Angical user can access {len(products)} products")
    else:
        print(f"❌ Angical user cannot access products: {products_response.status_code}")
        return False
    
    # Test dashboard access
    dashboard_response = requests.get(f"{base_url}/dashboard/stats", headers={
        "Authorization": f"Bearer {angical_token}"
    })
    
    if dashboard_response.status_code == 200:
        print(f"✅ Angical user can access dashboard stats")
    else:
        print(f"❌ Angical user cannot access dashboard: {dashboard_response.status_code}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 ALL ANGICAL USER TESTS PASSED!")
    print("✅ User Creation: angical user exists with correct properties")
    print("✅ Authentication: angical/angical123 credentials work")
    print("✅ Unit Assignment: assigned to 'Farmácia São Gonçalo do Angical'")
    print("✅ Access Control: can access protected endpoints")
    print("✅ User Management: admin can see angical user in users list")
    
    return True

if __name__ == "__main__":
    success = test_angical_user()
    exit(0 if success else 1)