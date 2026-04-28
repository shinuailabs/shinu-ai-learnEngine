
import sys
from pathlib import Path
import json

# Add src to path
sys.path.append(str(Path("src").resolve()))

from backend.services.run_service import RunService

try:
    svc = RunService()
    run_id = "pipeline_output_1777310530"
    print(f"Testing comparison for {run_id}")
    
    # Try to get comparison artifact
    comparison = svc.get_comparison(run_id)
    print("Rows:", len(comparison.rows))
    if comparison.rows:
        print("First row title:", comparison.rows[0].title)

except Exception as e:
    import traceback
    traceback.print_exc()
