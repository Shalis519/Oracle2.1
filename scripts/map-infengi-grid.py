from bs4 import BeautifulSoup
p='/home/ubuntu/Oracle2.1-repo/artifacts/api-server/src/lib/qimen/../../../../browser_html/infengi_ru_qm_1787164594564.html'
# use known absolute path instead
p='/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html'
s=BeautifulSoup(open(p,encoding='utf-8',errors='ignore'),'html.parser')
b=s.select_one('#qm_hours_tbl1 table.qm_table')
for ri,tr in enumerate(b.find_all('tr'),1):
 print('ROW',ri)
 for ci,td in enumerate(tr.find_all('td',recursive=False),1):
  cls=' '.join(td.get('class',[]))
  text=' '.join(td.stripped_strings)
  print(ci, cls, text[:70])
