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
    
    # Check if useChartTheme is already imported
    if "useChartTheme" not in content:
        # Import after 'react' or 'lucide-react'
        content = re.sub(r'(import .*? from ["\'].*?["\'];\n)(?=\s*export|\s*interface)', r'\1import { useChartTheme } from "@/hooks/useChartTheme";\n', content, count=1)
        
        # In case the above regex fails, just inject it before `export default function`
        if "useChartTheme" not in content:
            content = content.replace('export default function', 'import { useChartTheme } from "@/hooks/useChartTheme";\n\nexport default function')

    # Replace the hook definition block
    hook_regex = r'const \[chartColors, setChartColors\] = useState\(\{(.|\n)*?}\);\n\n\s*useEffect\(\(\) => \{(.|\n)*?}\}, \[\]\);'
    content = re.sub(hook_regex, 'const chartColors = useChartTheme();', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Refactored {filepath}")
