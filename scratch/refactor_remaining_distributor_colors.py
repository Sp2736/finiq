import os
import glob
import re

directory = "src/components/distributor/clients/"
filepaths = glob.glob(os.path.join(directory, "**/*.tsx"), recursive=True)

for filepath in filepaths:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace distributor-<number> with [var(--fin-brand-<number>)]
    new_content = re.sub(r'distributor-([0-9]{2,3})', r'[var(--fin-brand-\1)]', content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Refactored {filepath}")
