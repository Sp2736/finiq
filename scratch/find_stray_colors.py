import glob, re

colors = set('slate gray zinc neutral stone red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose white black'.split())

for f in glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True):
    content = open(f).read()
    for line_num, line in enumerate(content.splitlines(), 1):
        words = re.findall(r'[a-zA-Z0-9_-]+', line)
        for w in words:
            parts = w.split('-')
            if len(parts) > 1 and parts[-2] in colors and (parts[-1].isdigit() or parts[-1] in ('white', 'black', 'transparent')):
                print(f'{f}:{line_num}: {w}')
                break
            if w in ('bg-white', 'text-white', 'border-white', 'bg-black', 'text-black', 'border-black'):
                print(f'{f}:{line_num}: {w}')
                break
