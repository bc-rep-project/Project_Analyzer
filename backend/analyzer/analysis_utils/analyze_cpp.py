# analyzer/analysis_utils/analyze_cpp.py
import os
import subprocess
import json
import platform
import tempfile

from django.conf import settings 

def analyze_cpp(repo_path): 
    """Analyzes C++ code using the Clang tool.""" 
    try:
        # --- 1. Get analyzer paths from settings ---
        analyzer_path = settings.CPP_ANALYZER_PATH 
        output_dir = settings.ANALYSIS_OUTPUT_DIR 

        #  ------ 2. Compile the Clang Tool (if necessary) ----------- 
        if not os.path.exists(analyzer_path):
            compile_result = compile_cpp_analyzer()
            if compile_result.startswith("Error"):
                return {"error": compile_result}  

        # ------ 3.  Run the Clang Tool ----------- 
        # The C++ tool can now output to any given path
        with tempfile.NamedTemporaryFile(mode="w+", delete=False, suffix=".json") as tmp_file:
            output_path = tmp_file.name

        result = subprocess.run(
            [analyzer_path, repo_path, "--",  f"-o={output_path}"],  #  specify  output path  
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)) 
        )

        if result.returncode != 0:
            return {"error": f"C++ Analysis failed: {result.stderr}", "success": False}  

        # ----  4. Load JSON and move the Temporary file ---- 
        with open(output_path, "r") as f: 
            analysis_data = json.load(f)  

        os.replace(output_path, os.path.join(output_dir, 'cpp_analysis.json'))

        return analysis_data  

    except (FileNotFoundError, json.JSONDecodeError) as e:  
        return {"error": f"C++ Analysis error: {e}", "success": False}  
    except Exception as e:  
        return {"error": str(e), "success": False}
    
    
def compile_cpp_analyzer():
    """Compiles the analyze_cpp.cpp file, providing enhanced error messages. 

    Returns: 
       str: Path to the compiled executable if successful, an error message if not.
    """
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__)) 
        output_filename = 'analyze_cpp'  
        if platform.system() == 'Windows':
            output_filename += '.exe'

        clang_path = settings.CLANG_BIN_PATH

        command = [
            'cmake',
            '-B', '.', 
            '-S', current_dir,   
            f'-DCMAKE_CXX_COMPILER={clang_path}'
        ]
        subprocess.run(command, check=True, capture_output=True, text=True) # capture errors
        subprocess.run(['cmake', '--build',  '.'],  
                        check=True, capture_output=True, text=True) # capture errors 

        output_executable = os.path.abspath(os.path.join(current_dir, output_filename)) 
        return output_executable 

    except subprocess.CalledProcessError as e: 
        # ---  Informative Error Handling ---
        if "clang++: not found" in e.stderr or "cannot find -lclang" in e.stderr: 
            return "Error: Clang tools not found. Please install Clang and make sure the required libraries (like libclang) are available in your environment."
        else:
            return f"Error compiling C++ analyzer: {e.stderr}" # General compilation error

    except Exception as e: 
        return f"An error occurred: {e}"