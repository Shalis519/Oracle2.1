from bs4 import BeautifulSoup
p='/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html'
s=BeautifulSoup(open(p,encoding='utf-8',errors='ignore'),'html.parser')
b=s.select_one('#qm_hours_tbl1')
for td in b.select('td'):
 cls=' '.join(td.get('class',[]))
 if 'qm_dv_' in cls:
  txt=' '.join(td.stripped_strings)
  print(cls, '=>', txt[:120])
