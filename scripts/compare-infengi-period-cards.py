from pathlib import Path
import json

root=Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-period-benchmarks')
inf=json.loads((root/'infengi-period-cards.json').read_text(encoding='utf-8'))
aet=json.loads(Path('/home/ubuntu/Oracle2.1-repo/docs/aether-period-cards.json').read_text(encoding='utf-8'))
star_map={'蓬':'天蓬','任':'天任','冲':'天冲','沖':'天冲','輔':'天辅','辅':'天辅','英':'天英','芮':'天芮','柱':'天柱','心':'天心','禽':'天禽'}
door_map={'驚':'惊门','惊':'惊门','開':'开门','开':'开门','休':'休门','生':'生门','傷':'伤门','伤':'伤门','杜':'杜门','景':'景门','死':'死门'}
deity_map={'蛇':'螣蛇','符':'值符','天':'九天','地':'九地','陰':'太阴','阴':'太阴','合':'六合','陳':'白虎','陈':'白虎','雀':'玄武'}

def expected_star(raw): return star_map[raw[0]]
def expected_cell(c):
 return {'earthStem':c['earthStem'],'heavenStem':c['heavenStem'],'star':expected_star(c['star']),'door':door_map[c['door']],'deity':deity_map[c['deity']]}

def main_palaces(item):
 sp=expected_star(item['star']); gp=door_map[item['gate']]
 zf=next(int(p) for p,c in item['cells'].items() if expected_star(c['star'])==sp)
 zs=next(int(p) for p,c in item['cells'].items() if door_map[c['door']]==gp)
 return sp,zf,gp,zs

lines=['# Сравнение периодических карт infengi и Aether Oracle','']
counts={k:[0,0] for k in ['earthStem','heavenStem','star','door','deity']}
for i,(x,y) in enumerate(zip(inf,aet)):
 diffs=[]
 sp,zf,gp,zs=main_palaces(x)
 summary=[('star',y['zhiFuStar'],sp),('zhiFuPalace',y['zhiFuPalace'],zf),('door',y['zhiShiDoor'],gp),('zhiShiPalace',y['zhiShiPalace'],zs)]
 for k,a,b in summary:
  if a!=b: diffs.append(f'{k}: Aether={a}, infengi={b}')
 for p,c in x['cells'].items():
  ec=expected_cell(c); ac=y['cells'][p]
  for k in counts:
   counts[k][1]+=1
   if ac[k]==ec[k]: counts[k][0]+=1
   else: diffs.append(f'p{p} {k}: Aether={ac[k]}, infengi={ec[k]}')
 lines += [f"## {x['period']} {x['source']}",f"Infengi: Ju={'Инь' if x['yin'] else 'Ян'} {x['ju']}, Fu Tou {x['fu']}, Драйвер {x['driver']}, Врата {gp}, звезда {sp}.",f"Aether: Fu {y['zhiFuStar']} в {y['zhiFuPalace']}, Врата {y['zhiShiDoor']} в {y['zhiShiPalace']}.",f"Итог: {'совпадений нет' if not diffs else f'{len(diffs)} расхождений'}."]
 if diffs: lines += ['```text']+diffs[:30]+['```']
 lines.append('')
lines += ['## Сводка','', '| Поле | Совпадения | Всего | Доля |','|---|---:|---:|---:|']
for k,(a,b) in counts.items(): lines.append(f'| {k} | {a} | {b} | {a/b:.1%} |')
Path('/home/ubuntu/Oracle2.1-repo/docs/infengi-aether-period-comparison.md').write_text('\n'.join(lines),encoding='utf-8')
print('\n'.join(lines))
