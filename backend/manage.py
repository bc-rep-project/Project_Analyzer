#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# ... (other imports - you can remove the TypeScript related imports)...

def run_django_command(args):
    """Executes a Django management command."""
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(args)

def main():
    """Handles command-line arguments and executes appropriate actions."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

    # --- TypeScript Compilation Removed ---
    # It's now handled by your frontend build tool (e.g., Webpack). 

    # Pass all command line arguments directly to Django's command handler.
    run_django_command(sys.argv) 

if __name__ == '__main__':
    main()  # Corrected - removed extra parenthesis


# """Django's command-line utility for administrative tasks."""
# import os
# import sys
# import subprocess
# import shutil

# from django.conf import settings


# def compile_typescript():
#     """Compiles TypeScript code in the project."""
#     try:
#         project_root = os.path.dirname(os.path.abspath(__file__))
#         tsconfig_path = os.path.join(project_root, 'tsconfig.json')

#         npx_path = shutil.which('npx')
#         if not npx_path:
#             npx_path = getattr(settings, 'NPX_PATH', None)
#             if not npx_path:
#                 raise FileNotFoundError(
#                     "Could not locate 'npx'. Install Node.js and ensure 'npx' "
#                     "is in your PATH, or set NPX_PATH in settings.py"
#                 )

#         tsc_command = [npx_path, 'tsc', '--project', tsconfig_path]
#         subprocess.run(tsc_command, cwd=project_root, check=True)

#         print("TypeScript compilation successful!")

#     except (subprocess.CalledProcessError, FileNotFoundError) as e:
#         print(f"An error occurred during TypeScript compilation: {e}")
#         sys.exit(1)  

# def run_django_command(args):
#     """Executes a Django management command."""
#     try:
#         from django.core.management import execute_from_command_line
#     except ImportError as exc:
#         raise ImportError(
#             "Couldn't import Django. Are you sure it's installed and "
#             "available on your PYTHONPATH environment variable? Did you "
#             "forget to activate a virtual environment?"
#         ) from exc
#     execute_from_command_line(args)

# def main():
#     """Handles command-line arguments and executes appropriate actions."""
#     os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

#     if len(sys.argv) > 1:
#         command = sys.argv[1]  # Get the first command-line argument

#         if command == 'runserver':
#             # If the command is 'runserver', first compile TypeScript
#             compile_typescript()

#         # Always run the Django command provided on the command line
#         run_django_command(sys.argv)  
#     else:
#         # If no commands are provided, show the default help message
#         run_django_command(sys.argv) 

# if __name__ == '__main__':
#     main()


# #!/usr/bin/env python
# """Django's command-line utility for administrative tasks."""
# import os
# import sys
# import subprocess
# import shutil

# from django.conf import settings 

# def main():
#     """Run administrative tasks."""
#     os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

#     # --------- Automate TypeScript Compilation ---------
#     try:
#         project_root = os.path.dirname(os.path.abspath(__file__)) 
#         tsconfig_path = os.path.join(project_root, 'tsconfig.json')  

#         # Locate 'npx' in the system 
#         npx_path = shutil.which('npx')  
#         if not npx_path:
#             # If npx is not in the PATH, check settings 
#             npx_path = getattr(settings, 'NPX_PATH', None)
#             if not npx_path:
#                 raise FileNotFoundError(
#                     "Could not locate 'npx'. Install Node.js and ensure 'npx' "
#                     "is in your PATH, or set NPX_PATH in settings.py" 
#                 )

#         tsc_command = [npx_path, 'tsc', '--project', tsconfig_path] 
#         subprocess.run(tsc_command, cwd=project_root, check=True)

#         print("TypeScript compilation successful!")

#     except subprocess.CalledProcessError as e: 
#         print(f"TypeScript compilation failed: {e.stderr}")  
#         sys.exit(1)  # Exit if compilation is crucial for your app 

#     except FileNotFoundError as e:
#         print(e) 
#         sys.exit(1)

#     # ----- Original Django Logic (unchanged) ----- 
#     try: 
#         from django.core.management import execute_from_command_line
#     except ImportError as exc:
#         raise ImportError(
#             "Couldn't import Django. Are you sure it's installed and "
#             "available on your PYTHONPATH environment variable? Did you "
#             "forget to activate a virtual environment?"
#         ) from exc
#     execute_from_command_line(sys.argv)


# if __name__ == '__main__':
#     main()


# #!/usr/bin/env python
# """Django's command-line utility for administrative tasks."""
# import os
# import sys
# import subprocess


# def main():
#     """Run administrative tasks."""
#     os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

#     # --------- Automate TypeScript Compilation ---------
#     try:
#         project_root = os.path.dirname(os.path.abspath(__file__))
#         tsconfig_path = os.path.join(project_root, 'tsconfig.json')

#         npx_path = 'C:/Program Files/nodejs/npx.cmd'  # <-- PASTE PATH HERE
#         tsc_command = [npx_path, 'tsc', '--project', tsconfig_path]

#         subprocess.run(tsc_command,
#                        cwd=project_root,
#                        check=True)

#         print("TypeScript compilation successful!")

#     except subprocess.CalledProcessError as e:
#         print(f"TypeScript compilation failed: {e.stderr}")
#         # Handle other exceptions (you might want to exit here if compilation is critical) 

#     # ----- Original Django Logic (unchanged) ----- (Moved outside the except block)
#     try: 
#         from django.core.management import execute_from_command_line
#     except ImportError as exc:
#         raise ImportError(
#             "Couldn't import Django. Are you sure it's installed and "
#             "available on your PYTHONPATH environment variable? Did you "
#             "forget to activate a virtual environment?"
#         ) from exc
#     execute_from_command_line(sys.argv)


# if __name__ == '__main__':
#     main()


# #!/usr/bin/env python 
# """Django's command-line utility for administrative tasks."""  
# import os
# import sys 
# import subprocess
  

# def main():
#     """Run administrative tasks.""" 
#     os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')  
 

#     # --------- Automate TypeScript Compilation --------- 
#     try:
#         project_root = os.path.dirname(os.path.abspath(__file__))
#         tsconfig_path = os.path.join(project_root, 'tsconfig.json')

#         npx_path = 'C:/Program Files/nodejs/npx.cmd' # <-- PASTE PATH HERE
#         tsc_command = [npx_path, 'tsc', '--project', tsconfig_path] 

#         subprocess.run(tsc_command, 
#                        cwd=project_root,
#                        check=True) 

#         print("TypeScript compilation successful!") 
#     except subprocess.CalledProcessError as e:
#         print(f"TypeScript compilation failed: {e.stderr}") 
#         # Handle other exceptions

#      # ----- Original Django Logic  (unchanged) -----
#         try:
#             from django.core.management import execute_from_command_line 
#         except ImportError as exc: 
#             raise ImportError(
#                 "Couldn't import Django. Are you sure it's installed and "
#                 "available on your PYTHONPATH environment variable? Did you "
#                 "forget to activate a virtual environment?" 
#             ) from exc  
#         execute_from_command_line(sys.argv) 

# if __name__ == '__main__': 
#     main()


# #!/usr/bin/env python 
# """Django's command-line utility for administrative tasks."""  
# import os
# import sys 
# import subprocess
  

# def main():
#     """Run administrative tasks.""" 
#     os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')  
 

#     # --------- Automate TypeScript Compilation --------- 
#     try: 
#         project_root = os.path.dirname(os.path.abspath(__file__))  
#         # Providing full paths for clarity  
#         typescript_project_dir = os.path.join(project_root, 'backend')  
#         tsconfig_path = os.path.join(typescript_project_dir, 'tsconfig.json')

#         subprocess.run(['C:/Program Files/nodejs/npx.cmd', 'tsc', '--project', tsconfig_path],
#                     cwd=typescript_project_dir,
#                     check=True
#                     )
#         print("TypeScript compilation successful!") 
#     except subprocess.CalledProcessError as e:  
#         print(f"TypeScript compilation failed: {e.stderr}")  
#         # Handle other exceptions

#      # ----- Original Django Logic  (unchanged) -----
#         try:
#             from django.core.management import execute_from_command_line 
#         except ImportError as exc: 
#             raise ImportError(
#                 "Couldn't import Django. Are you sure it's installed and "
#                 "available on your PYTHONPATH environment variable? Did you "
#                 "forget to activate a virtual environment?" 
#             ) from exc  
#         execute_from_command_line(sys.argv) 

# if __name__ == '__main__': 
#     main()


# #!/usr/bin/env python  
# """Django's command-line utility for administrative tasks."""  
# import os
# import sys 
# import subprocess
  

# def main():
#     """Run administrative tasks.""" 
#     os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')  
 

#     # ---  Automate TypeScript Compilation --- 
#     try:  
#         # If 'tsc' is NOT in your system's PATH,  
#         # you need to provide the full path to the executable:  
#         tsc_path = 'C:/Users/BONGANI/AppData/Roaming/npm/tsc.cmd'  # REPLACE THIS WITH THE ACTUAL PATH  
 

#         subprocess.run([tsc_path, '--project', './tsconfig.json'], 
#                        cwd=os.path.join(os.path.dirname(__file__), 'backend'), 
#                        check=True) 
#         print("TypeScript compilation successful!")  

#     except subprocess.CalledProcessError as e: 
#        print(f"TypeScript compilation failed: {e.stderr}") 
#     except FileNotFoundError: 
#         print("The 'tsc' command (or TypeScript compiler) was not found."
#               "\n1. Ensure TypeScript is installed globally or in your project (using npm)" 
#               "\n2. If 'tsc' is not in your PATH environment variable,"
#               "\n    set  `tsc_path` in  `manage.py`  to the absolute path to the 'tsc' executable.")
#     except Exception as e: 
#         print(f"An unexpected error occurred during TypeScript compilation: {e}") 
  

#      # ----- Original Django Logic  (unchanged) -----
#         try:
#             from django.core.management import execute_from_command_line 
#         except ImportError as exc: 
#             raise ImportError(
#                 "Couldn't import Django. Are you sure it's installed and "
#                 "available on your PYTHONPATH environment variable? Did you "
#                 "forget to activate a virtual environment?" 
#             ) from exc  
#         execute_from_command_line(sys.argv) 

# if __name__ == '__main__': 
#     main()


# #!/usr/bin/env python
# """Django's command-line utility for administrative tasks.""" 
# import os 
# import sys
# import subprocess  
  

# def main():
#     """Run administrative tasks."""

#     os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

#     # --------- Automate TypeScript Compilation ---------
#     try:  
#         subprocess.run(['npx', 'tsc', '--project', './tsconfig.json'], cwd=os.path.join(os.path.dirname(__file__), 'backend'), check=True)
#         print("TypeScript compilation successful!")  
#     except subprocess.CalledProcessError as e:  
#         print(f"TypeScript compilation failed: {e.stderr}")  
#     except FileNotFoundError:
#         print("The 'tsc' command was not found. Make sure TypeScript is installed.")
#     except Exception as e:  
#         print(f"An unexpected error occurred: {e}")  
        
#    # --- Original Django Logic (keep it here) ---
#     try: 
#         from django.core.management import execute_from_command_line
#     except ImportError as exc:  
#             raise ImportError(
#                 "Couldn't import Django. Are you sure it's installed and "
#                 "available on your PYTHONPATH environment variable? Did you " 
#                 "forget to activate a virtual environment?" 
#         ) from exc
#     execute_from_command_line(sys.argv) 

# if __name__ == '__main__': 
#     main()


# #!/usr/bin/env python
# """Django's command-line utility for administrative tasks."""
# import os
# import sys


# def main():
#     """Run administrative tasks."""
#     os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
#     try:
#         from django.core.management import execute_from_command_line
#     except ImportError as exc:
#         raise ImportError(
#             "Couldn't import Django. Are you sure it's installed and "
#             "available on your PYTHONPATH environment variable? Did you "
#             "forget to activate a virtual environment?"
#         ) from exc
#     execute_from_command_line(sys.argv)


# if __name__ == '__main__':
#     main()