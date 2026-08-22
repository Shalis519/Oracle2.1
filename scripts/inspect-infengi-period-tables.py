from bs4 import BeautifulSoup
from pathlib import Path
import re
for path in sorted(Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-period-benchmarks').glob('*.html')) + [Path('/home/ubuntu/browser_html/infengi_ru_qm_1787166262211.html')]:
    if not path.exists(): continue
    s=BeautifulSoup(path.read_text(encoding='utf-8',errors='ignore'),'html.parser')
    ids=[x.get('id') for x in s.find_all(id=True) if re.search(r'(year|month|day|god|mes|den|rasklad)',x.get('id',''),re.I)]
    print(path.name, ids[:80])
