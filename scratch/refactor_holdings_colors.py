import os
import re

filepath = "src/components/distributor/clients/ClientHoldingsView.tsx"

with open(filepath, 'r') as f:
    content = f.read()

# Replace distributor-<number> with [var(--fin-brand-<number>)]
content = re.sub(r'distributor-([0-9]{2,3})', r'[var(--fin-brand-\1)]', content)

with open(filepath, 'w') as f:
    f.write(content)

print(f"Refactored {filepath}")
