from bs4 import BeautifulSoup
p='/home/ubuntu/browser_html/infengi_ru_qm_1787164594564.html'
s=BeautifulSoup(open(p,encoding='utf-8',errors='ignore'),'html.parser')
b=s.select_one('#qm_hours_tbl1')
for td in b.select('td.qm_dv_1'):
 print(td.prettify()[:12000])
 break
