from bs4 import BeautifulSoup
from pathlib import Path

src = Path('/home/ubuntu/browser_html/infengi_ru_qm_1787163862709.html')
out = Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-qm-structure.md')
soup = BeautifulSoup(src.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
lines = ['# Infengi Ци Мэнь — извлечение DOM', '']
for heading in soup.find_all(['h4','h3']):
    if 'Ци Мень года' in heading.get_text(' ', strip=True):
        table = heading.find_next('table', class_='qm_table')
        lines.append('## ' + heading.get_text(' ', strip=True))
        if not table:
            continue
        for i, td in enumerate(table.find_all('td'), 1):
            text = ' '.join(td.stripped_strings)
            if text:
                lines.append(f'### Ячейка {i}')
                lines.append(text[:3000])
                lines.append('')
        break
out.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(out)
print('\n'.join(lines[:120]))
