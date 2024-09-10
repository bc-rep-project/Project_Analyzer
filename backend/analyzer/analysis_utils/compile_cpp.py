# # analyzer/analysis_utils/compile_cpp.py  
# import os 
# import subprocess
# import platform  

# def compile_cpp_analyzer(clang_bin_path='clang++'):
#     """Compiles the analyze_cpp.cpp file. 

#     Args:
#        clang_bin_path (str, optional): Path to the clang++ executable. 
#                                          Defaults to 'clang++'. 

#     Returns:
#        str: Path to the compiled executable on success, 
#             or an error message on failure. 
#     """
#     try:
#         current_dir = os.path.dirname(os.path.abspath(__file__)) 
#         output_filename = 'analyze_cpp'  # Output executable name (no extension)
#         if platform.system() == 'Windows':
#             output_filename += '.exe'

#         # --- Build directly in the current directory ('analysis_utils') ----
#         command = [ 
#             'cmake', 
#             '-B', '.',   #  Use '.'  for build directory (same as source) 
#             '-S', current_dir,   
#             f'-DCMAKE_CXX_COMPILER={clang_bin_path}'  
#         ] 

#         # --- Compile ----
#         subprocess.run(command, check=True) 
#         subprocess.run(['cmake', '--build',  '.'],  # Build in the current directory  
#                         check=True)

#         output_executable = os.path.abspath(os.path.join(current_dir,  output_filename)) 
#         return output_executable  

#     except subprocess.CalledProcessError as e: 
#         return f"Error compiling C++ analyzer: {e}"  
#     except Exception as e:
#         return f"An error occurred: {e}"  

# if __name__ == "__main__":
#     executable_path = compile_cpp_analyzer()
#     print(executable_path) 