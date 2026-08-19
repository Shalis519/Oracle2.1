from pathlib import Path
import json

data = json.loads(Path('docs/money-studio-source.json').read_text(encoding='utf-8'))
lines = [
  '// Generated from docs/money-houses-source-extracted.txt.',
  '// Source: ДЕНЬГИВНАТАЛЬНОЙКАРТЕ(2).pdf. Do not edit literary text manually here.',
  'export type MoneyStudioSeed = { category: string; context: string; key: string; title: string; text: string; sourceNote: string };',
  'export const MONEY_STUDIO_SEEDS: MoneyStudioSeed[] = [',
]
for card in data['cards']:
    def q(value):
        return json.dumps(str(value), ensure_ascii=False)
    lines.append('  {')
    lines.append(f'    category: {q(card["category"])},')
    lines.append(f'    context: {q(card["context"])},')
    # For planet cards, convert Russian body keys to stable API keys.
    key = card['key']
    body_map = {'солнце':'sun','луна':'moon','меркурий':'mercury','венера':'venus','марс':'mars','юпитер':'jupiter','сатурн':'saturn','уран':'uranus','нептун':'neptune','плутон':'pluto'}
    sign_map = {'овен':'aries','телец':'taurus','близнецы':'gemini','рак':'cancer','лев':'leo','дева':'virgo','весы':'libra','скорпион':'scorpio','стрелец':'sagittarius','козерог':'capricorn','водолей':'aquarius','рыбы':'pisces'}
    for ru, en in body_map.items():
        key = key.replace(f'planet-house:{ru}:', f'planet-house:{en}:')
    for ru, en in sign_map.items():
        key = key.replace(f'house-sign:2:{ru}', f'house-sign:2:{en}')
    lines.append(f'    key: {q(key)},')
    lines.append(f'    title: {q(card["title"])},')
    lines.append(f'    text: {q(card["text"])},')
    lines.append('    sourceNote: "Источник: ДЕНЬГИВНАТАЛЬНОЙКАРТЕ(2).pdf",')
    lines.append('  },')
lines.append('];')
Path('artifacts/api-server/src/lib/moneyStudioSeeds.ts').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'generated {len(data["cards"])} seeds')
