from bs4 import BeautifulSoup
from pathlib import Path
import re
p=Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-period-benchmarks/year-2027-12-15.html')
s=BeautifulSoup(p.read_text(encoding='utf-8',errors='ignore'),'html.parser')
for tag in s.find_all(['div','table','section','fieldset']):
    attrs=' '.join(str(tag.get(a,'')) for a in ('id','class','style','data-type','data-rasklad'))
    if re.search(r'qm|rasklad|year|month|day|god|mes|den|godov|mesyac|dnev',attrs,re.I):
        txt=' '.join(tag.get_text(' ',strip=True).split())
        print(tag.name, attrs[:220], 'TEXT=',txt[:180])
