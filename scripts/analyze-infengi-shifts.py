from bs4 import BeautifulSoup
from pathlib import Path
import json,re

html='/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html'
aether=json.loads(Path('/home/ubuntu/Oracle2.1-repo/docs/aether-hour-cards-2026-08-21.json').read_text())
s=BeautifulSoup(open(html,encoding='utf-8',errors='ignore'),'html.parser')
class_to_palace={1:4,2:9,3:2,8:3,4:7,7:8,6:1,5:6}
path=[1,8,3,4,9,2,7,6]

def cell(td):
 t=td.find('table'); rows=t.find_all('tr')
 vals=[]
 for r in rows[:2]:
  vals.append([''.join(x.get_text(strip=True) for x in c.find_all('span',recursive=False)) for c in r.find_all('td',recursive=False)])
 return {'spirit':vals[0][0],'door':vals[0][1],'heaven':vals[0][2],'star':vals[1][0],'earth':vals[1][2]}

def inf(n):
 b=s.select_one(f'#qm_hours_tbl{n}'); out={}
 for td in b.select('td[class*="qm_dv_"]'):
  m=re.search(r'qm_dv_(\d+)',' '.join(td.get('class',[])))
  if m: out[class_to_palace[int(m.group(1))]]=cell(td)
 return out
# short forms from Aether
short={'天蓬':'蓬','天任':'任','天冲':'冲','天辅':'輔','天英':'英','天芮':'芮','天柱':'柱','天心':'心','天禽':'禽'}
for n,(a) in enumerate(aether,1):
 i=inf(n)
 print(f'\nH{n} {a["hourGz"]} zhiFu={a["zhiFuStar"]}@{a["zhiFuPalace"]} zhiShi={a["zhiShiDoor"]}@{a["zhiShiPalace"]}')
 print('star inf :', ' '.join(i[p]['star'] for p in path))
 print('star aet :', ' '.join(short.get(a['cells'][str(p)]['star'],a['cells'][str(p)]['star']) for p in path))
 print('heav inf :', ' '.join(i[p]['heaven'] for p in path))
 print('heav aet :', ' '.join(a['cells'][str(p)]['heavenStem'] for p in path))
