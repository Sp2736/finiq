import os
import re

files_to_refactor = [
    "src/app/distributor/calculators/fd/page.tsx",
    "src/app/distributor/calculators/goal/page.tsx",
    "src/app/distributor/calculators/mf-returns/page.tsx",
    "src/app/distributor/calculators/reverse-emi/page.tsx",
    "src/app/distributor/calculators/stp/page.tsx",
    "src/app/distributor/calculators/swp/page.tsx",
    "src/app/investor/calculators/fd/page.tsx",
    "src/app/investor/calculators/goal/page.tsx",
    "src/app/investor/calculators/mf-returns/page.tsx",
    "src/app/investor/calculators/reverse-emi/page.tsx",
    "src/app/investor/calculators/stp/page.tsx",
    "src/app/investor/calculators/swp/page.tsx",
]

for filepath in files_to_refactor:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Try multiple ways to replace the block
    pattern = r'const \[chartColors, setChartColors\] = useState\(\{[\s\S]*?\}\);[\s\S]*?useEffect\(\(\) => \{[\s\S]*?\}\, \[\]\);'
    
    new_content = re.sub(pattern, 'const chartColors = useChartTheme();', content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Successfully replaced block in {filepath}")
    else:
        print(f"Could not find block in {filepath}")
