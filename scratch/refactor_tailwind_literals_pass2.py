import os
import glob
import re

mapping = [
    # Gradients / Canvas
    (r'\bfrom-slate-100\b', 'from-[var(--fin-page-bg)]'),
    (r'\bvia-white\b', 'via-[var(--fin-content-surface)]'),
    (r'\bto-slate-200\b', 'to-[var(--fin-skeleton-base)]'),
    (r'\bfrom-slate-50\b', 'from-[var(--fin-page-bg)]'),
    (r'\bto-slate-100\b', 'to-[var(--fin-badge-neutral-bg)]'),
    (r'\bfrom-slate-800\b', 'from-[var(--fin-heading-tertiary)]'),
    (r'\bvia-slate-800\b', 'via-[var(--fin-heading-tertiary)]'),
    (r'\bto-slate-900\b', 'to-[var(--fin-heading-primary)]'),
    (r'\bfrom-rose-600\b', 'from-[var(--fin-badge-danger-text)]'),
    (r'\bvia-rose-500/50\b', 'via-[var(--fin-badge-danger-text)]/50'),
    (r'\bbg-rose-500/10\b', 'bg-[var(--fin-badge-danger-bg)]'),
    (r'\bbg-rose-500/20\b', 'bg-[var(--fin-badge-danger-bg)]'),
    (r'\bbg-rose-600\b', 'bg-[var(--fin-badge-danger-text)]'),
    (r'\bbg-rose-700\b', 'bg-[var(--fin-badge-danger-text)]'),
    (r'\btext-rose-900\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\bborder-white/60\b', 'border-[var(--fin-border-subtle)]/60'),
    (r'\bborder-white/30\b', 'border-[var(--fin-border-subtle)]/30'),
    (r'\bborder-white\b', 'border-[var(--fin-border-subtle)]'),
    (r'\bto-indigo-600/90\b', 'to-[var(--fin-brand-600)]/90'),
    (r'\bto-indigo-600\b', 'to-[var(--fin-brand-600)]'),
    (r'\bto-indigo-700\b', 'to-[var(--fin-brand-700)]'),
    (r'\bvia-indigo-600\b', 'via-[var(--fin-brand-600)]'),
    (r'\bbg-slate-300/80\b', 'bg-[var(--fin-heading-primary)]/80'),
    (r'\bbg-slate-300\b', 'bg-[var(--fin-heading-primary)]'),
    (r'\bbg-slate-700\b', 'bg-[var(--fin-heading-tertiary)]'),
    (r'\bbg-emerald-500\b', 'bg-[var(--fin-badge-success-text)]'),
    (r'\bbg-emerald-400\b', 'bg-[var(--fin-badge-success-border)]'),
    (r'\bshadow-slate-300/60\b', 'shadow-[0_8px_24px_var(--fin-modal-shadow)]'),
    (r'\bshadow-slate-900/30\b', 'shadow-[0_8px_24px_var(--fin-kpi-shadow)]'),
    (r'\bshadow-slate-900/20\b', 'shadow-[0_4px_16px_var(--fin-table-shadow)]'),
    (r'\bshadow-blue-500/15\b', 'shadow-[0_4px_16px_var(--fin-btn-primary-shadow)]'),
    (r'\bvia-teal-600\b', 'via-[var(--fin-badge-broker-text)]'),
    (r'\btext-amber-900\b', 'text-[var(--fin-badge-warning-text)]'),
    (r'\btext-red-700\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\bborder-red-100\b', 'border-[var(--fin-badge-danger-border)]'),
    (r'\bborder-slate-50\b', 'border-[var(--fin-table-row-border)]'),
    (r'\bdivide-slate-50\b', 'divide-[var(--fin-table-row-border)]'),
    (r'\bborder-slate-900\b', 'border-[var(--fin-heading-primary)]'),
    (r'\bborder-purple-100\b', 'border-[var(--fin-badge-admin-border)]'),
    (r'\bborder-sky-100\b', 'border-[var(--fin-badge-broker-border)]'),
    (r'\btext-rose-300\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\btext-rose-500\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\btext-rose-800\b', 'text-[var(--fin-badge-danger-text)]'),
    (r'\bborder-rose-400\b', 'border-[var(--fin-badge-danger-border)]'),
    (r'\bborder-rose-500\b', 'border-[var(--fin-badge-danger-border)]'),
    (r'\bborder-rose-700\b', 'border-[var(--fin-badge-danger-text)]'),
    (r'\bring-rose-500/20\b', 'ring-[var(--fin-badge-danger-border)]/20'),
    (r'\bring-emerald-600/20\b', 'ring-[var(--fin-badge-success-border)]/20'),
    (r'\bring-amber-600/20\b', 'ring-[var(--fin-badge-warning-border)]/20'),
    (r'\bring-slate-900/10\b', 'ring-[var(--fin-table-shadow)]'),
    (r'\bring-blue-400\b', 'ring-[var(--fin-input-ring-focus)]'),
    (r'\bring-blue-500\b', 'ring-[var(--fin-input-ring-focus)]'),
    (r'\bring-white\b', 'ring-[var(--fin-table-bg)]'),
    (r'\bbg-rose-500\b', 'bg-[var(--fin-badge-danger-bg)]'),
    (r'\btext-slate-50\b', 'text-[var(--fin-badge-neutral-bg)]'),
    (r'\bbg-blue-900\b', 'bg-[var(--fin-badge-broker-text)]'),
    (r'\bstroke-indigo-500\b', 'stroke-[var(--fin-brand-500)]'),
]

# Do not modify globals.css, scratch dir, or exported pdf configs
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

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Refactored {filepath}")
        modified_count += 1

print(f"Total files modified: {modified_count}")
