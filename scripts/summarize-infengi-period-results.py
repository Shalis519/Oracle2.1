from pathlib import Path
import json
inf=json.loads((Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-period-benchmarks')/'infengi-period-cards.json').read_text())
aet=json.loads(Path('/home/ubuntu/Oracle2.1-repo/docs/aether-period-cards.json').read_text())
sm={'蓬':'天蓬','任':'天任','冲':'天冲','沖':'天冲','輔':'天辅','辅':'天辅','英':'天英','芮':'天芮','柱':'天柱','心':'天心','禽':'天禽'}
dm={'驚':'惊门','惊':'惊门','開':'开门','开':'开门','休':'休门','生':'生门','傷':'伤门','伤':'伤门','杜':'杜门','景':'景门','死':'死门'}
hm={'蛇':'螣蛇','符':'值符','天':'九天','地':'九地','陰':'太阴','阴':'太阴','合':'六合','陳':'白虎','陈':'白虎','雀':'玄武'}
for kind in ('year','month','day'):
 print('\n',kind)
 for x,y in zip([z for z in inf if z['period']==kind],[z for z in aet if z['period']==kind]):
  counts={k:0 for k in ('earthStem','heavenStem','star','door','deity')}
  total=0
  for p,c in x['cells'].items():
   a=y['cells'][p]; e={'earthStem':c['earthStem'],'heavenStem':c['heavenStem'],'star':sm[c['star'][0]],'door':dm[c['door']],'deity':hm[c['deity']]}
   for k in counts:
    counts[k]+=a[k]==e[k]
   total+=1
  print(x['source'], {k:f'{v}/{total}' for k,v in counts.items()})
