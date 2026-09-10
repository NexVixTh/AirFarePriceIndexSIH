import sys
sys.path.insert(0, '.')
import time
from db.session import get_session
from pipeline.index_calculator import calculate_airfare_index
from pipeline.cpi_reference import fetch_official_cpi_transport

# Measure index calculation time
session = get_session()
try:
    t0 = time.perf_counter()
    res = calculate_airfare_index(session)
    calc_time = (time.perf_counter() - t0) * 1000

    # Measure MoSPI CPI load time
    t0 = time.perf_counter()
    cpi = fetch_official_cpi_transport(force_refresh=False)
    cpi_time = (time.perf_counter() - t0) * 1000

    print(f"Index Calculation Time (DB + Jevons-Laspeyres): {calc_time:.2f} ms")
    print(f"MoSPI CPI Retrieval Time (In-Memory Cache): {cpi_time:.2f} ms")
    print(f"Calculated Index Value: {res.get('index_value')}")
    print(f"Total Routes Calculated: {len(res.get('route_indices', {}))}")
finally:
    session.close()
