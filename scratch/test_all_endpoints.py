import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

test_cases = [
    # (name, path, expected_status)
    ("Health Check", "/api/v1/health", 200),
    ("Readiness Check", "/api/v1/ready", 200),
    ("OpenAPI Schema", "/openapi.json", 200),
    ("Docs UI", "/docs", 200),
    ("National Index", "/index", 200),
    ("National Index with Base Period", "/index?base_period=2024-01", 200),
    ("Index History", "/index/history?limit=10", 200),
    ("Routes List", "/routes", 200),
    ("Non-existent Route Stats", "/route-stats/XYZ/ABC", 404),
    ("Non-existent Airline Stats", "/airline-stats/ZZ_FAKE", 404),
    ("Anomalies List", "/anomalies?limit=5", 200),
    ("MoSPI CPI Series", "/cpi/official", 200),
    ("DGCA Validation Report", "/dgca-validation", 200),
    ("Scraper Logs", "/scraper-logs?limit=5", 200),
    ("Route Quotes Query", "/fares/route/DEL/BOM?days=7", 200),
]

passed = 0
failed = 0

print("=== EXECUTING COMPREHENSIVE ENDPOINT AUDIT ===")

for name, path, expected_status in test_cases:
    url = BASE_URL + path
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.getcode()
            body = resp.read()
            if status == expected_status:
                print(f"[PASS] {name:35s} | {path:30s} -> HTTP {status}")
                passed += 1
            else:
                print(f"[FAIL] {name:35s} | {path:30s} -> Got {status}, expected {expected_status}")
                failed += 1
    except urllib.error.HTTPError as e:
        if e.code == expected_status:
            print(f"[PASS] {name:35s} | {path:30s} -> HTTP {e.code} (Expected Error)")
            passed += 1
        else:
            print(f"[FAIL] {name:35s} | {path:30s} -> Got HTTP {e.code}, expected {expected_status}")
            failed += 1
    except Exception as ex:
        print(f"[ERROR] {name:35s} | {path:30s} -> Exception: {ex}")
        failed += 1

print(f"\nTOTAL: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
if failed > 0:
    sys.exit(1)
