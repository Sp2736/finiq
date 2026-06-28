import os
import re

files_and_replacements = [
    ("src/app/(auth)/login/page.tsx", r'#6366f1', 'var(--fin-brand-500)'),
    ("src/app/distributor/reports/systematic-transactions/page.tsx", r'#e2e8f0', 'var(--fin-border-subtle)'),
    ("src/app/investor/reports/systematic-transactions/page.tsx", r'#e2e8f0', 'var(--fin-border-subtle)'),
    ("src/components/distributor/DesktopBrokerageTable.tsx", r'#f8fafc', 'var(--fin-table-row-hover-bg)'),
    ("src/components/settings/ColorPickerGroup.tsx", r'#000000', 'var(--fin-heading-primary)'),
    ("src/components/settings/ThemePickerList.tsx", r'#3d60ab', 'var(--fin-brand-600)'),
]

for filepath, pattern, replacement in files_and_replacements:
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Fixed {filepath}")
    except FileNotFoundError:
        pass
