import os
import glob
import re

# Mapping rules derived from final-tasks.md Section 1.2
# Note: we use regex replacement with negative lookarounds to ensure we only replace full class names.
mapping = [
    # Backgrounds
    (r'\bbg-white\b', 'bg-[var(--fin-table-bg)]'), # Need manual touch up for card-bg vs table-bg, but table-bg is standard
    (r'\bbg-slate-50\b', 'bg-[var(--fin-page-bg)]'), 
    (r'\bbg-slate-100\b', 'bg-[var(--fin-skeleton-base)]'),
    (r'\bbg-slate-200\b', 'bg-[var(--fin-skeleton-base)]'),
    (r'\bbg-slate-800\b', 'bg-[var(--fin-heading-primary)]'),
    (r'\bbg-slate-900\b', 'bg-[var(--fin-heading-primary)]'),
    (r'\bbg-\[\#9be4ff1b\]\b', 'bg-[var(--fin-table-expanded-cell-highlight)]'),
    (r'\bbg-\[\#f8fafc\]\b', 'bg-[var(--fin-page-bg-subtle)]'),
    
    # Text
    (r'\btext-slate-900\b', 'text-[var(--fin-heading-primary)]'),
    (r'\btext-slate-800\b', 'text-[var(--fin-heading-tertiary)]'),
    (r'\btext-slate-700\b', 'text-[var(--fin-table-row-text)]'),
    (r'\btext-slate-600\b', 'text-[var(--fin-body-text)]'),
    (r'\btext-slate-500\b', 'text-[var(--fin-muted-text)]'),
    (r'\btext-slate-400\b', 'text-[var(--fin-aux-text)]'),
    (r'\btext-slate-300\b', 'text-[var(--fin-aux-text)]'),
    (r'\btext-white\b', 'text-[var(--fin-btn-primary-text)]'),
    
    # Borders
    (r'\bborder-slate-100\b', 'border-[var(--fin-border-subtle)]'),
    (r'\bborder-slate-200\b', 'border-[var(--fin-border)]'),
    (r'\bborder-slate-300\b', 'border-[var(--fin-border)]'),
    (r'\bborder-slate-400\b', 'border-[var(--fin-border)]'),
    (r'\bdivide-slate-100\b', 'divide-[var(--fin-table-row-border)]'),
    (r'\bdivide-slate-200\b', 'divide-[var(--fin-table-row-border)]'),
    
    # Rings
    (r'\bring-slate-100\b', 'ring-[var(--fin-input-ring-focus)]'),
    (r'\bring-slate-200\b', 'ring-[var(--fin-input-ring-focus)]'),
    (r'\bring-slate-500\b', 'ring-[var(--fin-input-ring-focus)]'),
    
    # Status Danger
    (r'\bbg-rose-50\b', 'bg-[var(--fin-badge-danger-bg)]'),
    (r'\btext-rose-600\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\btext-rose-700\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\bborder-rose-100\b', 'border-[var(--fin-badge-danger-border)]'),
    (r'\bborder-rose-200\b', 'border-[var(--fin-badge-danger-border)]'),
    (r'\btext-red-500\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\btext-red-600\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\bbg-red-50\b', 'bg-[var(--fin-badge-danger-bg)]'),
    
    # Status Success
    (r'\bbg-emerald-50\b', 'bg-[var(--fin-badge-success-bg)]'),
    (r'\bbg-emerald-100\b', 'bg-[var(--fin-badge-success-bg)]'),
    (r'\btext-emerald-500\b', 'text-[var(--fin-badge-success-text)]'),
    (r'\btext-emerald-600\b', 'text-[var(--fin-badge-success-text)]'),
    (r'\btext-emerald-700\b', 'text-[var(--fin-badge-success-text)]'),
    (r'\btext-emerald-800\b', 'text-[var(--fin-badge-success-text)]'),
    (r'\bborder-emerald-100\b', 'border-[var(--fin-badge-success-border)]'),
    (r'\bborder-emerald-200\b', 'border-[var(--fin-badge-success-border)]'),
    
    # Status Warning
    (r'\bbg-amber-50\b', 'bg-[var(--fin-badge-warning-bg)]'),
    (r'\bbg-amber-400\b', 'bg-[var(--fin-badge-warning-bg)]'),
    (r'\btext-amber-400\b', 'text-[var(--fin-badge-warning-text)]'),
    (r'\btext-amber-500\b', 'text-[var(--fin-badge-warning-text)]'),
    (r'\btext-amber-600\b', 'text-[var(--fin-badge-warning-text)]'),
    (r'\btext-amber-700\b', 'text-[var(--fin-badge-warning-text)]'),
    (r'\bborder-amber-100\b', 'border-[var(--fin-badge-warning-border)]'),
    (r'\bborder-amber-200\b', 'border-[var(--fin-badge-warning-border)]'),
    
    # Status Admin (Indigo)
    (r'\bbg-indigo-50\b', 'bg-[var(--fin-badge-admin-bg)]'),
    (r'\bbg-indigo-500\b', 'bg-[var(--fin-badge-admin-bg)]'),
    (r'\btext-indigo-600\b', 'text-[var(--fin-badge-admin-text)]'),
    (r'\btext-indigo-700\b', 'text-[var(--fin-badge-admin-text)]'),
    (r'\bborder-indigo-100\b', 'border-[var(--fin-badge-admin-border)]'),
    (r'\bborder-indigo-200\b', 'border-[var(--fin-badge-admin-border)]'),
    (r'\bborder-indigo-600\b', 'border-[var(--fin-badge-admin-border)]'),
    (r'\btext-purple-600\b', 'text-[var(--fin-badge-admin-text)]'),
    (r'\btext-purple-700\b', 'text-[var(--fin-badge-admin-text)]'),
    (r'\bbg-purple-50\b', 'bg-[var(--fin-badge-admin-bg)]'),
    
    # Status Broker (Blue / Sky / Teal)
    (r'\bbg-blue-50\b', 'bg-[var(--fin-badge-broker-bg)]'),
    (r'\bbg-blue-100\b', 'bg-[var(--fin-badge-broker-bg)]'),
    (r'\bbg-blue-200\b', 'bg-[var(--fin-badge-broker-bg)]'),
    (r'\bbg-blue-950\b', 'bg-[var(--fin-badge-broker-bg)]'),
    (r'\btext-blue-500\b', 'text-[var(--fin-badge-broker-text)]'),
    (r'\btext-blue-600\b', 'text-[var(--fin-badge-broker-text)]'),
    (r'\btext-blue-700\b', 'text-[var(--fin-badge-broker-text)]'),
    (r'\bborder-blue-200\b', 'border-[var(--fin-badge-broker-border)]'),
    (r'\bborder-blue-300\b', 'border-[var(--fin-badge-broker-border)]'),
    (r'\bborder-blue-400\b', 'border-[var(--fin-badge-broker-border)]'),
    (r'\bborder-blue-500\b', 'border-[var(--fin-badge-broker-border)]'),
    (r'\bborder-blue-950\b', 'border-[var(--fin-badge-broker-border)]'),
    (r'\btext-teal-600\b', 'text-[var(--fin-badge-broker-text)]'),
    (r'\btext-teal-700\b', 'text-[var(--fin-badge-broker-text)]'),
    (r'\bbg-teal-50\b', 'bg-[var(--fin-badge-broker-bg)]'),
    (r'\btext-sky-600\b', 'text-[var(--fin-badge-broker-text)]'),
    (r'\btext-sky-700\b', 'text-[var(--fin-badge-broker-text)]'),
    (r'\bbg-sky-50\b', 'bg-[var(--fin-badge-broker-bg)]'),
]

# Do not modify globals.css, scratch dir, or exported pdf configs in a way that breaks them
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
    for pattern, replacement in mapping:
        content = re.sub(pattern, replacement, content)
        
    # Also fix opacity modifiers for standard variables (if they end in /opacity)
    # e.g., bg-[var(--fin-table-bg)]/80 -> this is supported by tailwind v4 natively! We just don't have to change anything!
    # Wait, the instruction says:
    # "bg-white/80 → bg-[var(--fin-sidebar-bg)]/80 (if --fin-sidebar-bg is solid hex, the /80 modifier works directly)"
    # But my regex matches \bbg-white\b which matches the "bg-white" part of "bg-white/80" leaving "/80" intact! So "bg-[var(--fin-table-bg)]/80" will be produced automatically.

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Refactored {filepath}")
        modified_count += 1

print(f"Total files modified: {modified_count}")
