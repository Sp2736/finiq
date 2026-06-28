import os
import re

files_and_replacements = [
    ("src/components/layouts/PhoneInputForm.tsx", r'shadow-\[0_4px_14px_0_rgba\(16,185,129,0.4\)\]', 'shadow-[0_4px_16px_var(--fin-btn-primary-shadow)]'),
    ("src/components/layouts/PhoneInputForm.tsx", r'shadow-\[0_6px_20px_rgba\(6,78,59,0.5\)\]', 'shadow-[0_4px_16px_var(--fin-btn-primary-shadow)]'),
    ("src/app/(auth)/login/page.tsx", r'rgba\(16,185,129,0.9\)', 'var(--fin-badge-success-text)'),
    ("src/app/(auth)/login/page.tsx", r'rgba\(79,70,229,0.4\)', 'var(--fin-brand-500)'),
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
