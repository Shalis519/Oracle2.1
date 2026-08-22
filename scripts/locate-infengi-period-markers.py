from bs4 import BeautifulSoup
from pathlib import Path
for path in [Path('/home/ubuntu/browser_html/infengi_ru_qm_1787166262211.html'), Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-period-benchmarks/year-2027-12-15.html')]:
    s=BeautifulSoup(path.read_text(encoding='utf-8',errors='ignore'),'html.parser')
    print('\nFILE',path)
    for text in ['Ци Мень для года','Ци Мень для месяца','Ци Мень для дня','Расклад года','Расклад месяца','Расклад дня']:
        node=s.find(string=lambda x: x and text in x)
        if node:
            parent=node.parent
            print(text, 'tag=',parent.name,'id=',parent.get('id'),'class=',parent.get('class'))
            for sib in list(parent.parent.find_all_next(limit=5)):
                print(' next',sib.name,sib.get('id'),sib.get('class'))
