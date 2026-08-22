from bs4 import BeautifulSoup
from pathlib import Path
import json,re
html='/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html'
a=json.loads(Path('/home/ubuntu/Oracle2.1-repo/docs/aether-hour-cards-2026-08-21.json').read_text())
s=BeautifulSoup(open(html,encoding='utf-8',errors='ignore'),'html.parser')
mp={1:4,2:9,3:2,8:3,4:7,7:8,6:1,5:6}; path=[1,8,3,4,9,2,7,6]
def parse(n):
 b=s.select_one(f'#qm_hours_tbl{n}'); out={}
 for td in b.select('td[class*="qm_dv_"]'):
  m=re.search(r'qm_dv_(\d+)',' '.join(td.get('class',[])))
  if not m: continue
  p=mp[int(m.group(1))]; rows=td.find('table').find_all('tr'); vs=[]
  for r in rows[:2]: vs.append([''.join(x.get_text(strip=True) for x in c.find_all('span',recursive=False)) for c in r.find_all('td',recursive=False)])
  out[p]={'heaven':vs[0][2], 'star':vs[1][0], 'earth':vs[1][2]}
 return out
def rotations(base,target):
 return [k for k in range(8) if all(target[i]==base[(i+k)%8] for i in range(8))]
short={'天蓬':'蓬','天任':'任','天冲':'冲','天辅':'輔','天英':'英','天芮':'芮','天柱':'柱','天心':'心'}
for n,c in enumerate(a,1):
 i=parse(n)
 earth=[i[p]['earth'] for p in path]
 heaven=[i[p]['heaven'] for p in path]
 stars=[i[p]['star'] for p in path]
 aetstars=[short.get(c['cells'][str(p)]['star'],c['cells'][str(p)]['star']) for p in path]
 print(n,c['hourGz'], 'heavenOffset=',rotations(earth,heaven),'earth=', ''.join(earth),'heaven=', ''.join(heaven),'starMatchesAetherRotation=',rotations(aetstars,stars))
