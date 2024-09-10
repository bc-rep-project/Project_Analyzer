# analysis_utils/analyze_typescript.py
import subprocess 
import json 
from django.conf import settings

def analyzeTypeScriptRepository(repo_path):
    try:
        process = subprocess.run( 
            ['node', './analyzer/analysis_utils/analyze_typescript.js', repo_path], 
            cwd=settings.BASE_DIR,
            capture_output=True,
            text=True
        )

        if process.returncode == 0:
            try:
                analysis_data = json.loads(process.stdout)
                return analysis_data 
            except json.JSONDecodeError as e: 
                return {"error": f"Error decoding JSON from TypeScript analyzer: {e}"}
        else:
            return {"error": f"TypeScript analysis failed: {process.stderr}"}

    except FileNotFoundError as e:
        return {"error": f"Error: {e}", "success": False} 
    except Exception as e:
        return {"error": str(e), "success": False}