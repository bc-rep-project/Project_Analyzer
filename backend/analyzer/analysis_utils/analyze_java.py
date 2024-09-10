# backend/analyzer/analysis_utils/analyze_java.py
import os
import subprocess
import json
from django.conf import settings


def analyze_java(java_project_path):
    """Analyzes a Java project using PMD and a custom rule."""
    try:
        # -------- Get Configurations from Settings -----------
        custom_rules_dir = settings.CUSTOM_RULES_DIR 
        pmd_path = settings.PMD_PATH
        analysis_output_dir = settings.ANALYSIS_OUTPUT_DIR 

        java_source_file = os.path.join(custom_rules_dir, 'FunctionCallRule.java') 
        output_jar_path = os.path.join(custom_rules_dir, 'MyPMDCallRules.jar')

        pmd_core_jar = os.path.join(pmd_path, 'pmd-core-7.0.0.jar') # Update if necessary
        pmd_java_jar = os.path.join(pmd_path, 'pmd-java-7.0.0.jar') 
        pmd_jaxen_jar = os.path.join(pmd_path, 'pmd-jaxen-2.0.0.jar')  

        # -------- Java Compilation & JAR Creation ----------
        compile_command = [
            'javac', 
            '-cp', 
            pmd_core_jar, 
            java_source_file
        ] 
        subprocess.run(compile_command, check=True, cwd=custom_rules_dir) 

        manifest_path = os.path.join(custom_rules_dir, 'MANIFEST.MF')  
        jar_command = [
            'jar', 
            'cfm',
            output_jar_path,
            manifest_path,
            'FunctionCallRule.class' 
        ]
        subprocess.run(jar_command, check=True, cwd=custom_rules_dir)

        # -------- PMD Analysis -----------
        report_file_path = os.path.join(analysis_output_dir, 'pmd_report.json')  

        pmd_command = [ 
            'java',  
            '-cp',
            f'{pmd_core_jar}:{pmd_java_jar}:{pmd_jaxen_jar}:{output_jar_path}', 
            'net.sourceforge.pmd.PMD',
            '-d', 
            java_project_path,
            '-R', 
            f'rulesets/java/quickstart.xml,{output_jar_path}',  
            '-f',
            'json', 
            '-reportfile',  
            report_file_path
        ] 
        subprocess.run(pmd_command, capture_output=True, text=True, check=True)  

        return process_pmd_output(report_file_path) # Assuming this function uses the report file 

    except subprocess.CalledProcessError as e:  
        return {"error": f"Error during Java analysis: {e.stderr}", "success": False}
    except FileNotFoundError as e: 
        return {"error": f"File not found during Java Analysis: {e}", "success": False}
    except Exception as e:  
        return {"error": str(e), "success": False}


def process_pmd_output(report_file):
    """
    Processes the PMD JSON output.

    Args:
       report_file (str): Path to the 'pmd_report.json' file.

    Returns:
       dict: A dictionary with 'nodes' and 'links'
             representing the call graph.
    """

    nodes = []
    links = []

    try:
        with open(report_file, 'r') as f:
            data = json.load(f)

        for file_data in data['files']:
            file_path = file_data['filename']
            nodes.append({'id': file_path, 'type': 'file'})
            for violation in file_data['violations']:
                if violation['rule'] == 'MyFunctionCallRule':  # This should match your rule's name
                    message_lines = violation['message'].splitlines()
                    caller = next((line.split('Caller: ')[1].strip() for line in message_lines if 'Caller:' in line), '')
                    callee = next((line.split('Callee: ')[1].strip() for line in message_lines if 'Callee:' in line), '')

                    links.append({
                        'source': caller,
                        'target': callee,
                        'parent': file_path
                    })

                    if not any(node['id'] == caller for node in nodes):
                        nodes.append({
                            'id': caller,
                            'type': 'function',
                            'parent': file_path
                        })
                    if not any(node['id'] == callee for node in nodes):
                        nodes.append({
                            'id': callee,
                            'type': 'function'
                        })

    except (FileNotFoundError, json.JSONDecodeError) as e: 
        print(f"Error processing PMD report: {e}")
        return {"error": "Error processing PMD report.", "success": False} 

    return {'nodes': nodes, 'links': links, "success": True}