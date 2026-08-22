from bs4 import BeautifulSoup
from pathlib import Path
import re

src=Path('/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html')
out=Path('/home/ubuntu/Oracle2.1-repo/artifacts/api-server/src/lib/qimen-infengi.test.ts')
s=BeautifulSoup(src.read_text(encoding='utf-8',errors='ignore'),'html.parser')
mp={1:4,2:9,3:2,8:3,4:7,7:8,6:1,5:6}; path=[1,8,3,4,9,2,7,6]
rows=[]
for n in range(1,14):
 b=s.select_one(f'#qm_hours_tbl{n}')
 head=' '.join(s.select_one(f'#chas_block{n}').stripped_strings)
 gz=''.join(head.split()[:2])
 summary=' '.join(b.stripped_strings)
 fu=re.search(r'Fu Tou\s+(\S+)',summary).group(1)
 gate=re.search(r'Главные врата\s+(\S+)',summary).group(1)
 star=re.search(r'Главная звезда\s+(\S+)',summary).group(1)
 cells={}
 for td in b.select('td[class*="qm_dv_"]'):
  m=re.search(r'qm_dv_(\d+)',' '.join(td.get('class',[])))
  if not m: continue
  p=mp[int(m.group(1))]
  trs=td.find('table').find_all('tr')[:2]
  vals=[]
  for tr in trs:
   vals.append([''.join(x.get_text(strip=True) for x in c.find_all('span',recursive=False)) for c in tr.find_all('td',recursive=False)])
  cells[p]={'deity':vals[0][0],'door':vals[0][1],'heavenStem':vals[0][2],'star':vals[1][0],'earthStem':vals[1][2]}
 zf=next(p for p in path if cells[p]['star']==star)
 zs=next(p for p in path if cells[p]['door']==gate)
 rows.append({'gz':gz,'fu':fu,'gate':gate,'star':star,'zf':zf,'zs':zs,'cells':[[cells[p][k] for k in ['earthStem','heavenStem','star','door','deity']] for p in path]})

def q(x): return '"'+x.replace('"','\\"')+'"'
lines=['import { describe, expect, it } from "vitest";','import { buildChart } from "./qimen/chart";','', 'const PATH = [1, 8, 3, 4, 9, 2, 7, 6] as const;','', 'const EXPECTED = [']
for r in rows:
 lines.append('  '+str({'gz':r['gz'],'fu':r['fu'],'gate':r['gate'],'star':r['star'],'zf':r['zf'],'zs':r['zs'],'cells':r['cells']}).replace("'",'"').replace('True','true').replace('False','false')+',')
lines += ['];','', 'describe("Часовые карты Чжи Рен — benchmark infengi 21.08.2026", () => {','  it("совпадает по всем 13 двухчасовкам и всем восьми дворцам", () => {','    EXPECTED.forEach((expected, index) => {','      const hourBranch = index === 12 ? 0 : index;','      const date = new Date(index === 12 ? "2026-08-22T00:00:00" : "2026-08-21T00:00:00");','      const chart = buildChart(date, hourBranch);','      expect(chart.hourGz).toBe(expected.gz);','      expect(chart.zhiFuStar).toBe(expected.star === "芮" ? "天芮" : expected.star === "柱" ? "天柱" : "天心");','      expect(chart.zhiFuPalace).toBe(expected.zf);','      expect(chart.zhiShiPalace).toBe(expected.zs);','      expect(chart.zhiShiDoor).toBe(expected.gate === "驚" ? "惊门" : "开门");','      const actual = PATH.map((p) => { const c = chart.cells[p]; return [c.earthStem, c.heavenStem, c.star.slice(1), c.door === "惊门" ? "驚" : c.door === "开门" ? "開" : c.door.slice(0,1), c.deity === "螣蛇" ? "蛇" : c.deity === "九地" ? "地" : c.deity === "九天" ? "天" : c.deity === "值符" ? "符" : c.deity === "白虎" ? "陳" : c.deity === "玄武" ? "雀" : c.deity === "六合" ? "合" : c.deity === "太阴" ? "陰" : c.deity]; });','      expect(actual).toEqual(expected.cells);','    });','  });','});','']
out.write_text('\n'.join(lines),encoding='utf-8')
print(out)
