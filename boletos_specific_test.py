#!/usr/bin/env python3
"""
Specific test for Boletos system functionality
Tests the complete Boletos CRUD operations and dashboard integration
"""

import requests
import sys
from datetime import datetime, timedelta
import json

class BoletosSpecificTester:
    def __init__(self, base_url="https://pharmatrack-44.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_boletos = []

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
                print(f"   Response: {response.text[:500]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def login(self):
        """Login as admin"""
        print(f"\n🔐 Logging in as admin...")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"   ✅ Logged in as: {self.user_data['full_name']} ({self.user_data['role']})")
            return True
        return False

    def test_boletos_crud_complete(self):
        """Test complete CRUD operations for boletos"""
        print(f"\n📋 TESTING BOLETOS CRUD OPERATIONS")
        
        # 1. GET - List all boletos
        print(f"\n1️⃣ Testing GET /api/boletos")
        success, boletos = self.run_test(
            "List All Boletos",
            "GET",
            "boletos",
            200
        )
        
        if success:
            print(f"   📊 Found {len(boletos)} boletos")
            status_counts = {}
            for boleto in boletos:
                status = boleto['status']
                status_counts[status] = status_counts.get(status, 0) + 1
                print(f"   - {boleto['fornecedor']}: R$ {boleto['valor']} ({status}) - Venc: {boleto['data_vencimento']}")
            print(f"   📈 Status distribution: {status_counts}")
        
        # 2. POST - Create new boleto
        print(f"\n2️⃣ Testing POST /api/boletos")
        
        # Test with future date (should be pendente)
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        boleto_data = {
            "fornecedor": "Cimed Farmacêutica",
            "valor": 1250.75,
            "data_vencimento": future_date,
            "descricao": "Compra de medicamentos - Teste API",
            "categoria": "medicamentos",
            "numero_boleto": "TEST001",
            "codigo_barras": "12345678901234567890123456789012345678901234567890"
        }
        
        success, new_boleto = self.run_test(
            "Create Boleto (Future Date)",
            "POST",
            "boletos",
            200,
            data=boleto_data
        )
        
        if success:
            self.created_boletos.append(new_boleto['id'])
            print(f"   ✅ Created: {new_boleto['fornecedor']} - R$ {new_boleto['valor']}")
            print(f"   📅 Status: {new_boleto['status']} (Expected: pendente)")
            print(f"   📅 Vencimento: {new_boleto['data_vencimento']}")
        
        # Test with past date (should become vencido)
        past_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
        boleto_vencido_data = {
            "fornecedor": "Boticário Distribuidora",
            "valor": 890.50,
            "data_vencimento": past_date,
            "descricao": "Produtos de higiene - Teste Vencido",
            "categoria": "higiene",
            "numero_boleto": "TEST002"
        }
        
        success, boleto_vencido = self.run_test(
            "Create Boleto (Past Date)",
            "POST",
            "boletos",
            200,
            data=boleto_vencido_data
        )
        
        if success:
            self.created_boletos.append(boleto_vencido['id'])
            print(f"   ✅ Created: {boleto_vencido['fornecedor']} - R$ {boleto_vencido['valor']}")
            print(f"   📅 Status: {boleto_vencido['status']} (Should become vencido on next GET)")
        
        # 3. GET again to test automatic status update
        print(f"\n3️⃣ Testing Automatic Status Update")
        success, updated_boletos = self.run_test(
            "List Boletos (Check Status Update)",
            "GET",
            "boletos",
            200
        )
        
        if success:
            # Find our created boletos
            for boleto in updated_boletos:
                if boleto['id'] in self.created_boletos:
                    expected_status = "vencido" if boleto['data_vencimento'] < datetime.now().strftime("%Y-%m-%d") else "pendente"
                    actual_status = boleto['status']
                    status_ok = actual_status == expected_status
                    print(f"   {'✅' if status_ok else '❌'} {boleto['fornecedor']}: {actual_status} (Expected: {expected_status})")
        
        # 4. PUT - Mark boleto as paid
        print(f"\n4️⃣ Testing PUT /api/boletos/{self.created_boletos[0] if self.created_boletos else 'ID'}/pagar")
        
        if self.created_boletos:
            pagamento_data = {
                "data_pagamento": datetime.now().strftime("%Y-%m-%d"),
                "valor_pago": 1250.75
            }
            
            success, payment_response = self.run_test(
                "Mark Boleto as Paid",
                "PUT",
                f"boletos/{self.created_boletos[0]}/pagar",
                200,
                data=pagamento_data
            )
            
            if success:
                print(f"   ✅ Payment recorded successfully")
                
                # Verify the payment was recorded
                success, verify_boletos = self.run_test(
                    "Verify Payment Status",
                    "GET",
                    "boletos",
                    200
                )
                
                if success:
                    paid_boleto = next((b for b in verify_boletos if b['id'] == self.created_boletos[0]), None)
                    if paid_boleto:
                        print(f"   📊 Status after payment: {paid_boleto['status']}")
                        print(f"   📅 Payment date: {paid_boleto.get('data_pagamento', 'Not set')}")
        
        return True

    def test_dashboard_integration(self):
        """Test dashboard stats integration with boletos"""
        print(f"\n📋 TESTING DASHBOARD INTEGRATION")
        
        success, stats = self.run_test(
            "Dashboard Stats with Boletos",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            print(f"   📊 Dashboard Stats Retrieved:")
            print(f"   🧾 Boletos vencidos: {stats.get('boletos_vencidos', 'Missing')}")
            print(f"   🧾 Boletos a pagar: {stats.get('boletos_a_pagar', 'Missing')}")
            print(f"   💰 Valor a pagar: R$ {stats.get('boletos_a_pagar_valor', 'Missing')}")
            
            # Check if details are included
            vencidos_detalhes = stats.get('boletos_vencidos_detalhes', [])
            print(f"   📋 Boletos vencidos detalhes: {len(vencidos_detalhes)} items")
            
            for detalhe in vencidos_detalhes[:3]:  # Show first 3
                print(f"      - {detalhe.get('fornecedor', 'Unknown')}: R$ {detalhe.get('valor', 0)}")
            
            # Verify required fields are present
            required_fields = ['boletos_vencidos', 'boletos_a_pagar', 'boletos_a_pagar_valor', 'boletos_vencidos_detalhes']
            missing_fields = [field for field in required_fields if field not in stats]
            
            if missing_fields:
                print(f"   ❌ Missing required fields: {missing_fields}")
                return False
            else:
                print(f"   ✅ All required boletos fields present in dashboard stats")
                return True
        
        return False

    def test_edge_cases(self):
        """Test edge cases and validation"""
        print(f"\n📋 TESTING EDGE CASES")
        
        # Test invalid boleto ID for payment
        print(f"\n🔍 Testing invalid boleto ID for payment")
        success, response = self.run_test(
            "Pay Invalid Boleto ID",
            "PUT",
            "boletos/invalid-id/pagar",
            404,
            data={"data_pagamento": "2025-10-08", "valor_pago": 100.0}
        )
        
        # Test missing required fields
        print(f"\n🔍 Testing missing required fields")
        incomplete_boleto = {
            "fornecedor": "Test Supplier"
            # Missing valor, data_vencimento
        }
        
        success, response = self.run_test(
            "Create Boleto (Missing Fields)",
            "POST",
            "boletos",
            422,  # Validation error
            data=incomplete_boleto
        )
        
        return True

    def run_all_tests(self):
        """Run all boletos tests"""
        print("🧾 SISTEMA DE BOLETOS - TESTE ESPECÍFICO")
        print("=" * 60)
        
        # Login first
        if not self.login():
            print("❌ Login failed, stopping tests")
            return 1
        
        # Run all test suites
        self.test_boletos_crud_complete()
        self.test_dashboard_integration()
        self.test_edge_cases()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 RESULTADOS FINAIS")
        print(f"✅ Testes aprovados: {self.tests_passed}/{self.tests_run}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Taxa de sucesso: {success_rate:.1f}%")
        
        if success_rate >= 85:
            print("🎉 Sistema de Boletos funcionando corretamente!")
            return 0
        else:
            print("⚠️  Problemas encontrados no sistema de Boletos")
            return 1

def main():
    tester = BoletosSpecificTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())