import os
import shutil

def extract_contents(directory):
    script_dir = os.path.dirname(os.path.realpath(__file__))
    new_filepath = os.path.join(script_dir, 'Extracted', 'combined_code.txt')

    if not os.path.exists(new_filepath):
        os.makedirs(os.path.dirname(new_filepath), exist_ok=True)

    with open(new_filepath, 'w', encoding='utf-8') as combined_file:
        for dirpath, _, filenames in os.walk(directory):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as file:
                        contents = file.read()
                        combined_file.write(f"File: {filepath}\n")
                        combined_file.write("```\n")
                        combined_file.write(contents + '\n')
                        combined_file.write("```\n\n")
                except UnicodeDecodeError:
                    print(f"Could not decode file: {filepath}")

# Replace '/path/to/your_directory' with the actual absolute path
# extract_contents('backend/analyzer')
extract_contents('frontend/src')