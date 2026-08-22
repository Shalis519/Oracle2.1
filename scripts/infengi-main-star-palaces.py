from bs4 import BeautifulSoup
import re
p='/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html'
s=BeautifulSoup(open(p,encoding='utf-8',errors='ignore'),'html.parser')
mp={1:4,2:9,3:2,8:3,4:7,7:8,6:1,5:6}
for n in range(1,14):
 b=s.select_one(f'#qm_hours_tbl{n}')
 target=''
 for td in b.select('td[class*="qm_dv_"]'):
  m=re.search(r'qm_dv_(\d+)',' '.join(td.get('class',[])))
  if not m: continue
  rows=td.find('table').find_all('tr')
  vals=[''.join(x.get_text(strip=True) for x in rows[1].find_all('span',recursive=False))]
  star=vals[0]
  txt=' '.join(b.stripped_strings)
  main=re.search(r'Главная звезда\s+(\S+)',txt).group(1)
  if star==main: target=f"p{mp[int(m.group(1))]}"
 print(n, 'main',main,target)
