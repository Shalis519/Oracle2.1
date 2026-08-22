from bs4 import BeautifulSoup
from pathlib import Path
import html

src = Path('/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html')
out = Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-2026-08-21-hour-cards.md')
soup = BeautifulSoup(src.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
lines = ['# Infengi — часовые карты 21.08.2026', '', 'Источник: https://infengi.ru/qm', '']
root = soup.select_one('#qm_hours') or soup.select_one('#qmPrintObl')
blocks = soup.select('[id^="qm_hours_tbl"]')
for block in blocks:
    ident = block.get('id', '')
    if not ident.startswith('qm_hours_tbl'):
        continue
    num = ident.replace('qm_hours_tbl', '')
    head = block.find_previous('div', id=f'chas_block{num}')
    lines.append(f'## Двухчасовка {num}')
    if head:
        lines.append('Интервал: ' + ' '.join(head.stripped_strings))
    # Compact raw text for audit; data-desc carries the full labels/descriptions.
    text = ' '.join(block.stripped_strings)
    lines.append('Текст: ' + text[:1200])
    lines.append('')
    for i, td in enumerate(block.select('td.qm_dv_1, td[class*="qm_dv_"]'), 1):
        vals=[]
        for el in td.find_all(['span','td'], recursive=True):
            t=' '.join(el.stripped_strings)
            if t and t not in vals:
                vals.append(t)
        if vals:
            lines.append(f'Дворец {i}: ' + ' | '.join(vals[:12]))
    lines.append('')
out.write_text('\n'.join(lines)+'\n', encoding='utf-8')
print(out)
print('\n'.join(lines[:120]))
