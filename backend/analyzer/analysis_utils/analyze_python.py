# Previous code in this document for python analysis
# Add this at the top with the other imports
import pyan
import json
import lizard
import os


def analyze_python_repository(repo_path):
    """Analyzes all .py files in a repository to extract function call information.

    Args:
        repo_path: Path to the cloned GitHub repository.

    Returns:
        A dictionary representing the repository's function call graph.
    """
    try:
        nodes = []  
        links = []

        for root, _, files in os.walk(repo_path):
            for filename in files:
                if filename.endswith(".py"):
                    full_file_path = os.path.join(root, filename)
                    file_analysis = analyze_python_file(full_file_path)
                    nodes.extend(file_analysis['nodes'])
                    links.extend(file_analysis['links'])

        return {"nodes": nodes,
                "links": links,
                "success": True} 

    except FileNotFoundError as e:  
        return {"error": f"File not found during Python analysis: {e}",  
                "success": False}
    except Exception as e:  
        return {"error": f"An unexpected error occurred in Python analysis: {str(e)}", 
                "success": False}


def analyze_python_file(file_path):
    """Analyzes a single Python file and calculates complexity."""
    analysis = lizard.analyze_file(file_path)


    nodes = [{
        'id': file_path,
        'type': 'file',
        'complexity': analysis.average_cyclomatic_complexity,
        "code": ""  # Placeholder for the actual file code
    }]

    links = []


    # --------------- Get File Content ---------------
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            nodes[0]["code"] = f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        nodes[0]["code"] = f"Error reading file:  {e}"


    for func in analysis.function_list:
        # Get function source code
        start_line = func.start_line
        end_line = func.end_line

        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                function_code = ''.join(lines[start_line - 1:end_line])
        except Exception as e:
            function_code = f"Error retrieving function  code: {e}"


        nodes.append({
            'id': func.name,
            'type': 'function',
            'parent': file_path,
            'complexity': func.cyclomatic_complexity,
            'code': function_code  # Add the function code to the node
        })
        for called in func.calls:
            links.append({'source': func.name, 'target': called.name, 'parent': file_path})

    return {'nodes': nodes, 'links': links}