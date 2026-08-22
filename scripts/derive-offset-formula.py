import json
from pathlib import Path
cards=json.loads(Path('/home/ubuntu/Oracle2.1-repo/docs/aether-hour-cards-2026-08-21.json').read_text())
# observed infengi heaven offsets from the previous differential analysis
obs=[5,0,7,1,0,2,5,4,7,3,6,1,0]
path=[1,8,3,4,9,2,7,6]
for card,k in zip(cards,obs):
 pos={c['earthStem']:p for p,c in card['cells'].items() if int(p)!=5}
 p_hour=pos.get({0:'甲',1:'乙',2:'丙',3:'丁',4:'戊',5:'己',6:'庚',7:'辛',8:'壬',9:'癸'}[card['hourStem']])
 print(card['number'],card['hourGz'],'hs',card['hourStem'],'pHour',p_hour,'pathIndex',path.index(int(p_hour)) if p_hour and int(p_hour) in path else None,'obs',k,'zhiFuPalace',card['zhiFuPalace'])
