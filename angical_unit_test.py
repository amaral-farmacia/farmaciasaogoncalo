import requests
import sys
from datetime import datetime, timedelta
import json

class AngicalUnitTester:
    def __init__(self, base_url="https://pharmatrack-44.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, username, password):
        """Test login and get token"""
        print(f"\n🔐 Testing login for user: {username}")
        success, response = self.run_test(
            f"Login - {username}",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"   User: {self.user_data['full_name']} ({self.user_data['role']})")
            return True
        return False

    def test_angical_unit_data_verification(self):
        """Test the corrected Angical unit data and verify unit cleanup"""
        print("\n🏥 ANGICAL UNIT DATA VERIFICATION AND CLEANUP TEST")
        print("Testing corrected Angical farmacia data and unit cleanup...")
        
        # Store original credentials
        original_token = self.token
        original_user = self.user_data
        
        # Test 1: Login as admin to verify units
        if not self.test_login("admin", "admin123"):
            print("❌ Failed to login as admin for unit verification")
            return False
        
        # Test 2: GET /api/unidades should return exactly 2 units
        success, unidades = self.run_test(
            "Get Units - Verify Count",
            "GET",
            "unidades",
            200
        )
        
        if not success:
            print("❌ Failed to get units list")
            return False
        
        print(f"   Found {len(unidades)} units")
        
        if len(unidades) != 2:
            print(f"❌ Expected exactly 2 units, found {len(unidades)}")
            for i, unit in enumerate(unidades, 1):
                print(f"     Unit {i}: {unit.get('nome', 'Unknown')} - {unit.get('endereco', 'No address')}")
            return False
        
        print(f"   ✅ Exactly 2 units found (cleanup successful)")
        
        # Test 3: Verify Angical unit has correct data
        angical_unit = None
        main_unit = None
        
        for unit in unidades:
            if "Angical" in unit.get('nome', ''):
                angical_unit = unit
            else:
                main_unit = unit
        
        if not angical_unit:
            print("❌ Angical unit not found")
            return False
        
        print(f"   ✅ Angical unit found: {angical_unit.get('nome')}")
        
        # Verify Angical unit data
        expected_angical_data = {
            'nome': 'Farmácia São Gonçalo Angical',
            'endereco': 'Angical - BA',
            'telefone': '77999178367',
            'email': 'amaralfarmacias@gmail.com',
            'responsavel': 'Arquimedes Oliveira do Amaral'
        }
        
        verification_passed = True
        for field, expected_value in expected_angical_data.items():
            actual_value = angical_unit.get(field, '')
            if actual_value == expected_value:
                print(f"   ✅ {field}: {actual_value}")
            else:
                print(f"   ❌ {field}: Expected '{expected_value}', got '{actual_value}'")
                verification_passed = False
        
        if not verification_passed:
            print("❌ Angical unit data verification failed")
            return False
        
        # Test 4: Verify main unit exists
        if not main_unit:
            print("❌ Main unit not found")
            return False
        
        print(f"   ✅ Main unit found: {main_unit.get('nome')}")
        
        # Test 5: GET /api/dashboard/unidades should return 2 units maximum
        success, dashboard_units = self.run_test(
            "Dashboard Units - Verify Count",
            "GET",
            "unidades",  # Using same endpoint as dashboard uses
            200
        )
        
        if success:
            if len(dashboard_units) <= 2:
                print(f"   ✅ Dashboard units count correct: {len(dashboard_units)} units")
            else:
                print(f"   ❌ Dashboard units count too high: {len(dashboard_units)} units")
                verification_passed = False
        
        # Test 6: Verify admin user is assigned to main unit
        admin_user_success, admin_me = self.run_test(
            "Get Admin User Info",
            "GET",
            "auth/me",
            200
        )
        
        if admin_user_success:
            admin_unit_id = admin_me.get('unidade_id')
            main_unit_id = main_unit.get('id')
            
            if admin_unit_id == main_unit_id:
                print(f"   ✅ Admin user assigned to main unit")
            else:
                print(f"   ❌ Admin user unit assignment incorrect")
                print(f"     Admin unit ID: {admin_unit_id}")
                print(f"     Main unit ID: {main_unit_id}")
                verification_passed = False
        
        # Test 7: Test angical user login and unit assignment
        if self.test_login("angical", "angical123"):
            angical_user_success, angical_me = self.run_test(
                "Get Angical User Info",
                "GET",
                "auth/me",
                200
            )
            
            if angical_user_success:
                angical_user_unit_id = angical_me.get('unidade_id')
                angical_unit_id = angical_unit.get('id')
                
                if angical_user_unit_id == angical_unit_id:
                    print(f"   ✅ Angical user assigned to Angical unit")
                else:
                    print(f"   ❌ Angical user unit assignment incorrect")
                    print(f"     Angical user unit ID: {angical_user_unit_id}")
                    print(f"     Angical unit ID: {angical_unit_id}")
                    verification_passed = False
                
                # Test 8: Verify angical user can access their data
                angical_data_tests = [
                    ("produtos", "Products"),
                    ("clientes", "Clients"), 
                    ("boletos", "Boletos"),
                    ("dashboard/stats", "Dashboard Stats")
                ]
                
                for endpoint, name in angical_data_tests:
                    success, data = self.run_test(
                        f"Angical User - Access {name}",
                        "GET",
                        endpoint,
                        200
                    )
                    
                    if success:
                        if isinstance(data, list):
                            print(f"   ✅ Angical user can access {name}: {len(data)} items")
                        else:
                            print(f"   ✅ Angical user can access {name}")
                    else:
                        print(f"   ❌ Angical user cannot access {name}")
                        verification_passed = False
            else:
                print("❌ Failed to get angical user info")
                verification_passed = False
        else:
            print("❌ Failed to login as angical user")
            verification_passed = False
        
        # Restore original credentials
        self.token = original_token
        self.user_data = original_user
        
        if verification_passed:
            print(f"   🎉 ANGICAL UNIT DATA VERIFICATION AND CLEANUP COMPLETED SUCCESSFULLY")
            print(f"   ✅ All requirements met:")
            print(f"     - Exactly 2 units exist (cleanup successful)")
            print(f"     - Angical unit has correct data")
            print(f"     - Admin user assigned to main unit")
            print(f"     - Angical user assigned to Angical unit")
            print(f"     - Both users can login and access their data")
            return True
        else:
            print(f"   ❌ ANGICAL UNIT DATA VERIFICATION FAILED")
            return False

def main():
    print("🏥 ANGICAL UNIT DATA VERIFICATION - TESTE ESPECÍFICO")
    print("=" * 60)
    
    tester = AngicalUnitTester()
    
    # Run the specific Angical unit verification test as requested
    success = tester.test_angical_unit_data_verification()
    
    # Print final results
    print("\n" + "=" * 60)
    print("🏁 ANGICAL UNIT VERIFICATION TESTING COMPLETED")
    print(f"📊 Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"📈 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if success:
        print("🎉 ANGICAL UNIT VERIFICATION PASSED!")
        return 0
    else:
        print("❌ ANGICAL UNIT VERIFICATION FAILED!")
        print("⚠️  Alguns problemas encontrados no backend")
        return 1

if __name__ == "__main__":
    sys.exit(main())