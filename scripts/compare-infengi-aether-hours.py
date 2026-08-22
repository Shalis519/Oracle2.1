from bs4 import BeautifulSoup
from pathlib import Path
import json, re

html_path = Path('/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html')
aether_path = Path('/home/ubuntu/Oracle2.1-repo/docs/aether-hour-cards-2026-08-21.json')
out_path = Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-aether-hour-comparison-2026-08-21.md')

soup = BeautifulSoup(html_path.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
aether = json.loads(aether_path.read_text(encoding='utf-8'))
class_to_palace = {1: 4, 2: 9, 3: 2, 8: 3, 4: 7, 7: 8, 6: 1, 5: 6}
short = {
    '惊门':'驚','开门':'開','休门':'休','生门':'生','伤门':'傷','杜门':'杜','景门':'景','死门':'死',
    '天蓬':'蓬','天任':'任','天冲':'冲','天辅':'輔','天英':'英','天芮':'芮','天柱':'柱','天心':'心','天禽':'禽',
    '螣蛇':'蛇','九地':'地','九天':'天','值符':'符','白虎':'陳','六合':'合','太阴':'陰','玄武':'雀',
}

def get_cell(td):
    inner = td.find('table')
    rows = inner.find_all('tr') if inner else []
    vals=[]
    for row in rows[:2]:
        spans=[]
        for c in row.find_all('td', recursive=False):
            ss=c.find_all('span', recursive=False)
            spans.append(''.join(x.get_text(strip=True) for x in ss))
        vals.append(spans)
    spirit = vals[0][0] if len(vals)>0 and len(vals[0])>0 else ''
    door = vals[0][1] if len(vals)>0 and len(vals[0])>1 else ''
    # В HTML infengi верхний ствол — Небесная тарелка,
    # нижний ствол — Земная тарелка.
    heaven = vals[0][2] if len(vals)>0 and len(vals[0])>2 else ''
    star = vals[1][0] if len(vals)>1 and len(vals[1])>0 else ''
    earth = vals[1][2] if len(vals)>1 and len(vals[1])>2 else ''
    return {'spirit':spirit,'door':door,'earthStem':earth,'star':star,'heavenStem':heaven}

def parse_infengi():
    result=[]
    for n in range(1,14):
        block=soup.select_one(f'#qm_hours_tbl{n}')
        head=soup.select_one(f'#chas_block{n}')
        text=' '.join(block.stripped_strings) if block else ''
        m=re.search(r'Fu Tou\s+(\S+)\s+Драйвер\s+(\S+)\s+Главные врата\s+(\S+)\s+Главная звезда\s+(\S+)', text)
        cells={}
        if block:
            for td in block.select('td[class*="qm_dv_"]'):
                match=re.search(r'qm_dv_(\d+)', ' '.join(td.get('class',[])))
                if match:
                    p=class_to_palace.get(int(match.group(1)))
                    if p: cells[p]=get_cell(td)
        result.append({
            'number':n,
            'hourLabel':' '.join(head.stripped_strings) if head else '',
            'summary': {'fuTou':m.group(1),'driver':m.group(2),'gate':m.group(3),'star':m.group(4)} if m else {},
            'cells':cells,
        })
    return result

inf=parse_infengi()
name_to_short={k:v for k,v in short.items()}

def cmp_cell(i, a):
    return {
      'earthStem': (i.get('earthStem') == a.get('earthStem')),
      'heavenStem': (i.get('heavenStem') == a.get('heavenStem')),
      'star': short.get(a.get('star'), a.get('star')) == i.get('star'),
      'door': short.get(a.get('door'), a.get('door')) == i.get('door'),
      'spirit': short.get(a.get('deity'), a.get('deity')) == i.get('spirit'),
    }

lines=['# Сравнение infengi и Aether Oracle — 21.08.2026','', 'Источник infengi: `sistem=1` (Чжи Рен), Москва, UTC+3.', '']
totals={k:0 for k in ['earthStem','heavenStem','star','door','spirit']}
for infc, ac in zip(inf, aether):
    lines.append(f"## {infc['number']}. {infc['hourLabel']}")
    lines.append(f"Infengi: Fu Tou {infc['summary'].get('fuTou','?')}, Драйвер {infc['summary'].get('driver','?')}, Главные Врата {infc['summary'].get('gate','?')}, Главная звезда {infc['summary'].get('star','?')}.")
    lines.append(f"Aether: {ac['hourGz']}, Ju {ac['ju']['ju']} {'Инь' if ac['ju']['yin'] else 'Ян'}, 值符 {ac['zhiFuStar']} в {ac['zhiFuPalace']}, 值使 {ac['zhiShiDoor']} в {ac['zhiShiPalace']}.")
    mism=[]
    for p in [1,2,3,4,6,7,8,9]:
        i=infc['cells'].get(p,{})
        a=ac['cells'].get(str(p),{})
        c=cmp_cell(i,a)
        for k,v in c.items():
            totals[k]+=int(v)
            if not v: mism.append(f"{p}:{k} inf={i.get(k)} aether={a.get('earthStem' if k=='earthStem' else 'heavenStem' if k=='heavenStem' else 'star' if k=='star' else 'door' if k=='door' else 'deity')}")
    match_count=sum(1 for p in [1,2,3,4,6,7,8,9] for v in cmp_cell(infc['cells'].get(p,{}),ac['cells'].get(str(p),{})).values() if v)
    lines.append(f"Совпадения полей: {match_count}/40.")
    lines.append('Расхождения: ' + ('; '.join(mism) if mism else 'нет') + '.')
    lines.append('')
lines += ['## Итог по 13 картам','', '| Поле | Совпадения | Всего | Доля |','|---|---:|---:|---:|']
for k,v in totals.items():
    total=13*8
    lines.append(f'| {k} | {v} | {total} | {v/total:.1%} |')
out_path.write_text('\n'.join(lines)+'\n', encoding='utf-8')
print(out_path)
print('\n'.join(lines[:100]))
