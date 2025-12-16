import requests
import sys
from datetime import datetime, timedelta
import json

class AdvancedFeaturesAPITester:
    def __init__(self, base_url="https://pharmatrack-44.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
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
        if params:
            print(f"   Params: {params}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, params=params, timeout=10)
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

    def test_dre_mensal(self):
        """Test DRE API - Monthly report"""
        # Test current month
        current_month = datetime.now().strftime("%Y-%m")
        
        success, response = self.run_test(
            "DRE - Monthly Report (Current Month)",
            "GET",
            "relatorios/dre",
            200,
            params={"tipo": "mensal", "data": current_month}
        )
        
        if success:
            print(f"   Period: {response.get('periodo', {}).get('data', 'N/A')}")
            
            # Validate structure
            required_fields = ['periodo', 'dre', 'indicadores']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"   ❌ Missing top-level fields: {missing_fields}")
                return False
            
            # Validate DRE structure
            dre = response.get('dre', {})
            dre_required = ['receita_bruta', 'deducoes_receita', 'receita_liquida', 
                           'custo_produtos_vendidos', 'lucro_bruto', 'despesas_operacionais',
                           'resultado_operacional', 'resultado_liquido']
            
            dre_missing = [field for field in dre_required if field not in dre]
            if dre_missing:
                print(f"   ❌ Missing DRE fields: {dre_missing}")
                return False
            
            # Validate indicators
            indicadores = response.get('indicadores', {})
            ind_required = ['margem_bruta', 'margem_operacional', 'margem_liquida', 'total_transacoes']
            
            ind_missing = [field for field in ind_required if field not in indicadores]
            if ind_missing:
                print(f"   ❌ Missing indicator fields: {ind_missing}")
                return False
            
            # Display key metrics
            print(f"   📊 DRE RESULTS:")
            print(f"     - Receita Bruta: R$ {dre.get('receita_bruta', 0):.2f}")
            print(f"     - Receita Líquida: R$ {dre.get('receita_liquida', 0):.2f}")
            print(f"     - CPV: R$ {dre.get('custo_produtos_vendidos', 0):.2f}")
            print(f"     - Lucro Bruto: R$ {dre.get('lucro_bruto', 0):.2f}")
            print(f"     - Resultado Operacional: R$ {dre.get('resultado_operacional', 0):.2f}")
            print(f"     - Resultado Líquido: R$ {dre.get('resultado_liquido', 0):.2f}")
            
            print(f"   📈 INDICADORES:")
            print(f"     - Margem Bruta: {indicadores.get('margem_bruta', 0):.2f}%")
            print(f"     - Margem Operacional: {indicadores.get('margem_operacional', 0):.2f}%")
            print(f"     - Margem Líquida: {indicadores.get('margem_liquida', 0):.2f}%")
            print(f"     - Total Transações: {indicadores.get('total_transacoes', 0)}")
            
            print(f"   ✅ DRE monthly structure is complete")
        
        return success, response if success else {}

    def test_dre_diario(self):
        """Test DRE API - Daily report"""
        # Test specific date
        test_date = "2025-12-16"
        
        success, response = self.run_test(
            "DRE - Daily Report (Specific Date)",
            "GET",
            "relatorios/dre",
            200,
            params={"tipo": "diario", "data": test_date}
        )
        
        if success:
            periodo = response.get('periodo', {})
            print(f"   Date: {periodo.get('data', 'N/A')}")
            print(f"   Type: {periodo.get('tipo', 'N/A')}")
            
            dre = response.get('dre', {})
            print(f"   Daily Revenue: R$ {dre.get('receita_bruta', 0):.2f}")
            print(f"   Daily Net Result: R$ {dre.get('resultado_liquido', 0):.2f}")
            
            # Validate same structure as monthly
            required_fields = ['periodo', 'dre', 'indicadores']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"   ❌ Missing fields in daily DRE: {missing_fields}")
                return False
            
            print(f"   ✅ DRE daily structure is complete")
        
        return success

    def test_dre_authentication(self):
        """Test DRE requires authentication"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "DRE - No Authentication",
            "GET",
            "relatorios/dre",
            403,  # Should require authentication
            params={"tipo": "mensal"}
        )
        
        # Restore token
        self.token = original_token
        
        if success:
            print(f"   ✅ DRE correctly requires authentication")
            return True
        else:
            print(f"   ❌ DRE should require authentication")
            return False

    def test_fiados_vencidos(self):
        """Test Fiados Vencidos API"""
        success, response = self.run_test(
            "Fiados Vencidos - Get All",
            "GET",
            "fiados-vencidos",
            200
        )
        
        if success:
            # Validate structure
            required_fields = ['resumo', 'fiados_vencidos', 'vencem_hoje', 'vencem_em_3_dias', 'data_consulta']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False
            
            # Validate resumo structure
            resumo = response.get('resumo', {})
            resumo_required = ['total_vencidos', 'total_vencem_hoje', 'total_vencem_3_dias',
                              'valor_total_vencido', 'valor_vence_hoje', 'valor_vence_3_dias']
            
            resumo_missing = [field for field in resumo_required if field not in resumo]
            if resumo_missing:
                print(f"   ❌ Missing resumo fields: {resumo_missing}")
                return False
            
            # Display results
            print(f"   📊 RESUMO FIADOS:")
            print(f"     - Vencidos: {resumo.get('total_vencidos', 0)} (R$ {resumo.get('valor_total_vencido', 0):.2f})")
            print(f"     - Vencem Hoje: {resumo.get('total_vencem_hoje', 0)} (R$ {resumo.get('valor_vence_hoje', 0):.2f})")
            print(f"     - Vencem em 3 dias: {resumo.get('total_vencem_3_dias', 0)} (R$ {resumo.get('valor_vence_3_dias', 0):.2f})")
            
            # Show some details
            fiados_vencidos = response.get('fiados_vencidos', [])
            vencem_hoje = response.get('vencem_hoje', [])
            vencem_3_dias = response.get('vencem_em_3_dias', [])
            
            print(f"   📋 DETALHES:")
            if fiados_vencidos:
                print(f"     Vencidos ({len(fiados_vencidos)}):")
                for fiado in fiados_vencidos[:3]:  # Show first 3
                    print(f"       - {fiado.get('cliente_nome', 'N/A')}: R$ {fiado.get('valor_pendente', 0):.2f} ({fiado.get('dias_vencido', 0)} dias)")
            
            if vencem_hoje:
                print(f"     Vencem Hoje ({len(vencem_hoje)}):")
                for fiado in vencem_hoje[:3]:
                    print(f"       - {fiado.get('cliente_nome', 'N/A')}: R$ {fiado.get('valor_pendente', 0):.2f}")
            
            print(f"   Data consulta: {response.get('data_consulta', 'N/A')}")
            print(f"   ✅ Fiados vencidos structure is complete")
        
        return success, response if success else {}

    def test_definir_vencimento_fiado(self, fiados_data):
        """Test setting due date for fiado"""
        # Try to find a fiado to update
        all_fiados = (fiados_data.get('fiados_vencidos', []) + 
                     fiados_data.get('vencem_hoje', []) + 
                     fiados_data.get('vencem_em_3_dias', []))
        
        if not all_fiados:
            print("   ⚠️ No fiados available to test vencimento update")
            return True  # Not a failure, just no data
        
        fiado_to_update = all_fiados[0]
        fiado_id = fiado_to_update.get('id')
        
        if not fiado_id:
            print("   ❌ Fiado ID not found")
            return False
        
        # Set new due date (30 days from now)
        new_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        success, response = self.run_test(
            f"Set Fiado Due Date - {fiado_to_update.get('cliente_nome', 'Unknown')}",
            "PUT",
            f"fiados/{fiado_id}/definir-vencimento",
            200,
            params={"data_vencimento": new_date}
        )
        
        if success:
            print(f"   ✅ Due date set to: {new_date}")
            print(f"   Message: {response.get('message', 'N/A')}")
        
        return success

    def test_alertas_fiados(self):
        """Test fiados alerts for dashboard"""
        success, response = self.run_test(
            "Fiados Alerts - Dashboard",
            "GET",
            "alertas-fiados",
            200
        )
        
        if success:
            alertas = response if isinstance(response, list) else []
            print(f"   📢 ALERTAS ENCONTRADOS: {len(alertas)}")
            
            for alerta in alertas:
                print(f"     - {alerta.get('tipo', 'N/A')}: {alerta.get('titulo', 'N/A')}")
                print(f"       Valor: R$ {alerta.get('valor', 0):.2f}")
                print(f"       Cor: {alerta.get('cor', 'N/A')} | Ícone: {alerta.get('icone', 'N/A')}")
            
            print(f"   ✅ Fiados alerts working")
        
        return success

    def test_clube_vantagens_top_clientes(self):
        """Test Clube de Vantagens - Top Clients"""
        success, response = self.run_test(
            "Clube de Vantagens - Top Clients",
            "GET",
            "clube-vantagens/top-clientes",
            200
        )
        
        if success:
            # Validate structure
            required_fields = ['periodo_analise', 'clube_vantagens', 'top_clientes', 'estatisticas']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False
            
            # Display results
            periodo = response.get('periodo_analise', {})
            clube = response.get('clube_vantagens', {})
            top_clientes = response.get('top_clientes', [])
            stats = response.get('estatisticas', {})
            
            print(f"   📊 CLUBE DE VANTAGENS:")
            print(f"     - Desconto: {clube.get('desconto_percentual', 0)}%")
            print(f"     - Clientes Elegíveis: {clube.get('total_clientes_elegíveis', 0)}")
            print(f"     - Critério: {clube.get('criterio', 'N/A')}")
            
            print(f"   🏆 TOP CLIENTES ({len(top_clientes)}):")
            for i, cliente in enumerate(top_clientes, 1):
                print(f"     {i}. {cliente.get('nome', 'N/A')}")
                print(f"        Total Compras: R$ {cliente.get('total_compras', 0):.2f}")
                print(f"        Transações: {cliente.get('total_transacoes', 0)}")
                print(f"        Ticket Médio: R$ {cliente.get('ticket_medio', 0):.2f}")
                print(f"        Status: {cliente.get('status_clube', 'N/A')}")
            
            print(f"   📈 ESTATÍSTICAS:")
            print(f"     - Total clientes com compras: {stats.get('total_clientes_com_compras', 0)}")
            print(f"     - Total vendas período: R$ {stats.get('total_vendas_periodo', 0):.2f}")
            print(f"     - Valor médio top 5: R$ {stats.get('valor_medio_top_5', 0):.2f}")
            
            print(f"   ✅ Clube de vantagens structure is complete")
        
        return success, response if success else {}

    def test_verificar_cliente_clube(self, top_clientes_data):
        """Test client club verification"""
        top_clientes = top_clientes_data.get('top_clientes', [])
        
        if not top_clientes:
            print("   ⚠️ No top clients available to test verification")
            return True
        
        # Test with eligible client
        cliente_elegivel = top_clientes[0]
        cliente_id = cliente_elegivel.get('cliente_id')
        
        success, response = self.run_test(
            f"Verify Club Client - Eligible ({cliente_elegivel.get('nome', 'Unknown')})",
            "GET",
            f"clube-vantagens/verificar-cliente/{cliente_id}",
            200
        )
        
        if success:
            print(f"   Cliente: {response.get('message', 'N/A')}")
            print(f"   Tem desconto: {response.get('tem_desconto', False)}")
            print(f"   Desconto: {response.get('desconto_percentual', 0)}%")
            print(f"   Posição ranking: {response.get('posicao_ranking', 'N/A')}")
            
            # Validate eligible client response
            if (response.get('tem_desconto') == True and 
                response.get('desconto_percentual') == 10.0 and
                response.get('cliente') is not None):
                print(f"   ✅ Eligible client verification correct")
            else:
                print(f"   ❌ Eligible client verification failed")
                return False
        
        # Test with non-eligible client (fake ID)
        fake_client_id = "non-existent-client-id"
        
        success2, response2 = self.run_test(
            "Verify Club Client - Non-eligible",
            "GET",
            f"clube-vantagens/verificar-cliente/{fake_client_id}",
            200
        )
        
        if success2:
            print(f"   Non-eligible: {response2.get('message', 'N/A')}")
            print(f"   Tem desconto: {response2.get('tem_desconto', False)}")
            
            # Validate non-eligible client response
            if (response2.get('tem_desconto') == False and 
                response2.get('desconto_percentual') == 0.0 and
                response2.get('cliente') is None):
                print(f"   ✅ Non-eligible client verification correct")
            else:
                print(f"   ❌ Non-eligible client verification failed")
                return False
        
        return success and success2

    def test_authentication_required(self):
        """Test that all new endpoints require authentication"""
        # Store original token
        original_token = self.token
        self.token = None
        
        endpoints_to_test = [
            ("relatorios/dre", {"tipo": "mensal"}),
            ("fiados-vencidos", None),
            ("clube-vantagens/top-clientes", None),
            ("alertas-fiados", None)
        ]
        
        all_passed = True
        
        for endpoint, params in endpoints_to_test:
            success, response = self.run_test(
                f"Auth Required - {endpoint}",
                "GET",
                endpoint,
                403,  # Should require authentication
                params=params
            )
            
            if not success:
                print(f"   ❌ {endpoint} should require authentication")
                all_passed = False
            else:
                print(f"   ✅ {endpoint} correctly requires authentication")
        
        # Restore token
        self.token = original_token
        
        return all_passed

    def run_comprehensive_test(self):
        """Run all advanced features tests"""
        print("🚀 ADVANCED FEATURES COMPREHENSIVE TESTING")
        print("=" * 60)
        
        # Test with admin credentials
        print("\n👤 TESTING WITH ADMIN USER")
        if not self.test_login("admin", "admin123"):
            print("❌ Failed to login as admin")
            return False
        
        # Test authentication requirements
        print("\n🔐 AUTHENTICATION TESTS")
        if not self.test_authentication_required():
            print("❌ Authentication tests failed")
            return False
        
        # Test DRE functionality
        print("\n📊 DRE (DEMONSTRAÇÃO DO RESULTADO) TESTS")
        dre_mensal_success, dre_data = self.test_dre_mensal()
        if not dre_mensal_success:
            print("❌ DRE monthly test failed")
            return False
        
        if not self.test_dre_diario():
            print("❌ DRE daily test failed")
            return False
        
        if not self.test_dre_authentication():
            print("❌ DRE authentication test failed")
            return False
        
        # Test Fiados Vencidos functionality
        print("\n💳 FIADOS VENCIDOS TESTS")
        fiados_success, fiados_data = self.test_fiados_vencidos()
        if not fiados_success:
            print("❌ Fiados vencidos test failed")
            return False
        
        if not self.test_definir_vencimento_fiado(fiados_data):
            print("❌ Set fiado due date test failed")
            return False
        
        if not self.test_alertas_fiados():
            print("❌ Fiados alerts test failed")
            return False
        
        # Test Clube de Vantagens functionality
        print("\n🏆 CLUBE DE VANTAGENS TESTS")
        clube_success, clube_data = self.test_clube_vantagens_top_clientes()
        if not clube_success:
            print("❌ Clube de vantagens top clients test failed")
            return False
        
        if not self.test_verificar_cliente_clube(clube_data):
            print("❌ Client club verification test failed")
            return False
        
        # Test with collaborator user
        print("\n👤 TESTING WITH COLLABORATOR USER")
        if not self.test_login("angical", "angical123"):
            print("❌ Failed to login as collaborator")
            return False
        
        # Test that collaborator can also access these endpoints
        print("\n🔍 COLLABORATOR ACCESS TESTS")
        if not self.test_dre_mensal()[0]:
            print("❌ Collaborator cannot access DRE")
            return False
        
        if not self.test_fiados_vencidos()[0]:
            print("❌ Collaborator cannot access fiados vencidos")
            return False
        
        if not self.test_clube_vantagens_top_clientes()[0]:
            print("❌ Collaborator cannot access clube de vantagens")
            return False
        
        # Final summary
        print("\n" + "=" * 60)
        print(f"🎯 ADVANCED FEATURES TESTING COMPLETE")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL ADVANCED FEATURES TESTS PASSED!")
            return True
        else:
            print("⚠️ Some tests failed - check output above")
            return False

if __name__ == "__main__":
    tester = AdvancedFeaturesAPITester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)