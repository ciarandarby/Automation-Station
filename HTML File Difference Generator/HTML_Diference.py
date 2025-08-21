"""
This one's short but sweet. 
All it does it take two hard-coded folder paths as str values of folder1_path and folder2_path.
Within these folders should be HTML files of the same name, what this does is basically check version history without going through large HTML files. 
It highlightes changes and differences between the two, it can handle many files at once and will create a summery file in the output_path, this can be anything. 
"""

import os
import difflib

def compare_html_folders():
    folder1_path = 'FOLDER_PATH_1'
    folder2_path = 'FOLDER_PATH_1'
    output_path = 'HTML_DIFFERENCE_OUTPUT'

    os.makedirs(output_path, exist_ok=True)

    files_to_compare = [
        f for f in os.listdir(folder1_path)
        if f.endswith('.html') and os.path.isfile(os.path.join(folder1_path, f))
    ]

    for filename in files_to_compare:
        file1_full_path = os.path.join(folder1_path, filename)
        file2_full_path = os.path.join(folder2_path, filename)

        if not os.path.exists(file2_full_path):
            continue

        with open(file1_full_path, 'r', encoding='utf-8') as f1:
            from_lines = f1.readlines()
        with open(file2_full_path, 'r', encoding='utf-8') as f2:
            to_lines = f2.readlines()

        html_diff = difflib.HtmlDiff(wrapcolumn=80).make_file(
            from_lines,
            to_lines,
            fromdesc=f'Original: {filename}',
            todesc=f'Modified: {filename}'
        )

        diff_filename = f'difference_{filename}'
        diff_filepath = os.path.join(output_path, diff_filename)

        with open(diff_filepath, 'w', encoding='utf-8') as f_out:
            f_out.write(html_diff)

if __name__ == '__main__':
    compare_html_folders()