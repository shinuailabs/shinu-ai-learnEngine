
import sys
from pathlib import Path
import json

# Add src to path
sys.path.append(str(Path("src").resolve()))

from backend.services.run_service import RunService

try:
    svc = RunService()
    latest = svc.get_latest_run()
    print("Latest run ID:", latest.run_id)
    
    # Try to get search artifact for latest run
    search = svc.get_search_artifact(latest.run_id)
    print("Search query:", search.search_query)
    print("Videos:", len(search.videos))

except Exception as e:
    import traceback
    traceback.print_exc()
