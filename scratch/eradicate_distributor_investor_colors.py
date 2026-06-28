import os
import glob
import re

excludes = ["globals.css", "scratch", "portfolioExport.ts", "transactionReportExport.ts"]

directory = "src/"
filepaths = glob.glob(os.path.join(directory, "**/*.tsx"), recursive=True)
filepaths += glob.glob(os.path.join(directory, "**/*.ts"), recursive=True)

modified_count = 0

for filepath in filepaths:
    if any(ex in filepath for ex in excludes):
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace scrollbar-thumb-slate-200
    content = content.replace("scrollbar-thumb-slate-200", "scrollbar-thumb-[var(--fin-border-subtle)]")
    
    # Replace distributor-50..950 with [var(--fin-brand-50..950)]
    content = re.sub(r'\bdistributor-([0-9]{2,3})\b', r'[var(--fin-brand-\1)]', content)
    
    # Replace investor-50..950 with [var(--fin-brand-50..950)]
    content = re.sub(r'\binvestor-([0-9]{2,3})\b', r'[var(--fin-brand-\1)]', content)
    
    # Replace any leftover slate, gray, white, etc if found
    content = content.replace("slate-50", "[var(--fin-page-bg)]")
    content = content.replace("slate-400", "[var(--fin-aux-text)]")
    content = content.replace("slate-900", "[var(--fin-heading-primary)]")

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Refactored {filepath}")
        modified_count += 1

print(f"Total files modified: {modified_count}")
