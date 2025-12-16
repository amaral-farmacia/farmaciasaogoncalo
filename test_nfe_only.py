#!/usr/bin/env python3

import requests
import sys
from datetime import datetime, timedelta
import json

class NFeTester:
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

    def test_comprehensive_nfe_system(self):
        """Test complete NFe system functionality"""
        print("\n📄 COMPREHENSIVE NFE SYSTEM TESTING")
        
        # 1. Test authentication requirement
        print("\n🔒 Testing Authentication Requirements")
        original_token = self.token
        self.token = None
        
        # Test without auth - should get 403
        success, response = self.run_test(
            "NFe List - No Auth",
            "GET",
            "notas-fiscais",
            403
        )
        
        if not success:
            print("❌ Authentication test failed")
            self.token = original_token
            return False
        
        # Restore token
        self.token = original_token
        print("✅ Authentication properly enforced")
        
        # 2. Get existing NFes (should show sample data)
        print("\n📋 Testing NFe List")
        success, notas_fiscais = self.run_test(
            "Get Notas Fiscais",
            "GET",
            "notas-fiscais",
            200
        )
        
        if not success:
            print("❌ Failed to get NFes list")
            return False
        
        print(f"   Found {len(notas_fiscais)} notas fiscais")
        
        # Check for sample data
        sample_found = 0
        expected_samples = ["000123456", "000789012"]
        for nota in notas_fiscais:
            print(f"   - NFe {nota['numero']}/{nota['serie']}: {nota['fornecedor_nome']}")
            print(f"     CNPJ: {nota['fornecedor_cnpj']} | Valor: R$ {nota['valor_total']}")
            print(f"     Status: {nota['status']} | Produtos: {len(nota.get('produtos', []))}")
            
            if nota['numero'] in expected_samples:
                sample_found += 1
        
        print(f"   Sample NFes found: {sample_found}/2")
        
        # 3. Create new NFe
        print("\n📝 Testing NFe Creation")
        nota_data = {
            "numero": "000999888",
            "serie": "001",
            "fornecedor_nome": "TESTE DISTRIBUIDORA LTDA",
            "fornecedor_cnpj": "11.222.333/0001-44",
            "data_emissao": "2025-01-20",
            "valor_total": 2500.00,
            "valor_produtos": 2200.00,
            "valor_servicos": 0.0,
            "valor_desconto": 50.00,
            "valor_frete": 100.00,
            "icms_total": 250.00,
            "ipi_total": 0.0,
            "produtos": [
                {
                    "codigo": "TEST001",
                    "nome": "Medicamento Teste A",
                    "quantidade": 100,
                    "valor_unitario": 10.00,
                    "valor_total": 1000.00
                },
                {
                    "codigo": "TEST002", 
                    "nome": "Medicamento Teste B",
                    "quantidade": 80,
                    "valor_unitario": 15.00,
                    "valor_total": 1200.00
                }
            ],
            "observacoes": "NFe criada via teste automatizado"
        }
        
        success, nova_nfe = self.run_test(
            "Create Nota Fiscal",
            "POST",
            "notas-fiscais",
            200,
            data=nota_data
        )
        
        if not success:
            print("❌ Failed to create new NFe")
            return False
        
        print(f"   Created NFe: {nova_nfe['numero']}/{nova_nfe['serie']}")
        print(f"   Status: {nova_nfe['status']}")
        
        # 4. Get specific NFe by ID
        print("\n🔍 Testing NFe by ID")
        success, nfe_details = self.run_test(
            f"Get NFe by ID",
            "GET",
            f"notas-fiscais/{nova_nfe['id']}",
            200
        )
        
        if not success:
            print("❌ Failed to get NFe by ID")
            return False
        
        print(f"   Retrieved NFe: {nfe_details['numero']}/{nfe_details['serie']}")
        print(f"   Produtos: {len(nfe_details.get('produtos', []))}")
        
        # 5. Test XML upload simulation
        print("\n📤 Testing XML Upload Simulation")
        success, xml_response = self.run_test(
            "Upload XML NFe",
            "POST",
            "notas-fiscais/upload-xml",
            200
        )
        
        if not success:
            print("❌ XML upload simulation failed")
            return False
        
        print(f"   Status: {xml_response.get('status', 'unknown')}")
        dados_extraidos = xml_response.get('dados_extraidos', {})
        if dados_extraidos:
            print(f"   Extracted NFe: {dados_extraidos.get('numero')}/{dados_extraidos.get('serie')}")
            print(f"   Fornecedor: {dados_extraidos.get('fornecedor_nome')}")
            print(f"   Valor: R$ {dados_extraidos.get('valor_total')}")
        
        # 6. Test NFe reports
        print("\n📊 Testing NFe Reports")
        success, report = self.run_test(
            "Get NFe Report",
            "GET",
            "notas-fiscais/relatorio",
            200
        )
        
        if not success:
            print("❌ NFe report generation failed")
            return False
        
        totais = report.get('totais', {})
        print(f"   Total NFes: {totais.get('total_notas', 0)}")
        print(f"   Valor Total: R$ {totais.get('valor_total_geral', 0)}")
        
        # 7. Test delete functionality
        print("\n🗑️ Testing NFe Deletion")
        success, delete_response = self.run_test(
            f"Delete NFe",
            "DELETE",
            f"notas-fiscais/{nova_nfe['id']}",
            200
        )
        
        if not success:
            print("❌ Failed to delete NFe")
            return False
        
        print("   NFe deleted successfully")
        
        # Verify deletion
        success, verify_response = self.run_test(
            "Verify NFe Deletion",
            "GET",
            f"notas-fiscais/{nova_nfe['id']}",
            404
        )
        
        if success:
            print("   ✅ NFe successfully removed from database")
        else:
            print("   ❌ NFe still exists after deletion")
            return False
        
        # 8. Test invalid ID deletion
        print("\n🚫 Testing Invalid ID Deletion")
        success, invalid_response = self.run_test(
            "Delete Invalid NFe ID",
            "DELETE",
            "notas-fiscais/invalid-nfe-id-12345",
            404
        )
        
        if success:
            print("   ✅ Invalid NFe ID correctly rejected")
        else:
            print("   ❌ Invalid NFe ID should return 404")
            return False
        
        print(f"\n✅ COMPREHENSIVE NFE SYSTEM TEST COMPLETED SUCCESSFULLY")
        return True

def main():
    print("📄 NFE SYSTEM - COMPREHENSIVE TESTING")
    print("=" * 50)
    
    tester = NFeTester()
    
    # Login as admin
    if not tester.test_login("admin", "admin123"):
        print("❌ Admin login failed, stopping tests")
        return 1
    
    # Run comprehensive NFe tests
    if tester.test_comprehensive_nfe_system():
        print("\n🎉 NFE SYSTEM WORKING CORRECTLY!")
        success_rate = (tester.tests_passed / tester.tests_run) * 100
        print(f"📈 Success Rate: {success_rate:.1f}% ({tester.tests_passed}/{tester.tests_run})")
        return 0
    else:
        print("\n❌ NFE SYSTEM HAS ISSUES")
        return 1

if __name__ == "__main__":
    sys.exit(main())