from bs4 import BeautifulSoup
from pathlib import Path
import json,re

ROOT=Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-period-benchmarks')
OUT=ROOT/'infengi-period-cards.json'
mp={1:4,2:9,3:2,8:3,4:7,7:8,6:1,5:6}

def short_deity(x): return x

def parse_cell(td):
    table=td.find('table')
    rows=table.find_all('tr')[:2]
    vals=[]
    for r in rows:
        vals.append([''.join(s.get_text(strip=True) for s in c.find_all('span', recursive=False)) for c in r.find_all('td', recursive=False)])
    return {'deity': vals[0][0], 'door': vals[0][1], 'heavenStem': vals[0][2], 'star': vals[1][0], 'earthStem': vals[1][2]}

def parse(path, period):
    s=BeautifulSoup(path.read_text(encoding='utf-8',errors='ignore'),'html.parser')
    container=s.select_one(f'.rasklad_{period}')
    if not container: raise RuntimeError(f'{path}: no {period}')
    text=' '.join(container.stripped_strings)
    def cap(label):
        m=re.search(label+r'\s+(\S+)',text)
        return m.group(1) if m else ''
    table=container.find('table',class_='qm_table')
    cells={}
    for td in table.select('td[class*="qm_dv_"]'):
        m=re.search(r'qm_dv_(\d+)',' '.join(td.get('class',[])))
        if not m: continue
        cells[str(mp[int(m.group(1))])]=parse_cell(td)
    ju_match=re.search(r'(Ян|Инь)\s+(\d+)',text)
    return {'source':path.name,'period':period,'label':text.split()[2] if len(text)>2 else '', 'fu':cap('Fu Tou'),'driver':cap('Драйвер'),'gate':cap('Главные врата'),'star':cap('Главная звезда'),'yin':ju_match.group(1)=='Инь' if ju_match else None,'ju':int(ju_match.group(2)) if ju_match else None,'cells':cells}

items=[]
for path in sorted(ROOT.glob('*.html')):
    for period in ('year','month','day'):
        # Each chosen response contains all three, so collect only the requested point by filename prefix.
        if path.name.startswith(period+'-'):
            items.append(parse(path,period))
OUT.write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
print('saved',OUT,'items',len(items))
