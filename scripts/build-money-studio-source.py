from pathlib import Path
import json
import re

raw = Path('docs/money-houses-source-extracted.txt').read_text(encoding='utf-8').replace('\x0c', '\n')
lines = [line.strip() for line in raw.splitlines()]

sign_names = ['овен','телец','близнецы','рак','лев','дева','весы','скорпион','стрелец','козерог','водолей','рыбы']
planet_names_ru = ['Солнце','Луна','Меркурий','Венера','Марс','Юпитер','Сатурн','Уран','Нептун','Плутон']


def section_text(start_re: str, end_res: list[str]) -> str:
    start = re.search(start_re, raw, re.I | re.M)
    if not start:
        return ''
    end = len(raw)
    for end_re in end_res:
        m = re.search(end_re, raw[start.end():], re.I | re.M)
        if m:
            end = min(end, start.end() + m.start())
    return re.sub(r'\s+', ' ', raw[start.end():end]).strip()


def paragraph_text(start_re: str, end_res: list[str]) -> str:
    return section_text(start_re, end_res)


def parse_signs():
    cards = []
    for idx, sign in enumerate(sign_names):
        text = paragraph_text(
            rf'^Если второй дом в знаке {sign}\s*$',
            [rf'^Если второй дом в знаке {s}\s*$' for s in sign_names if s != sign]
            + [r'^II дом - значение', r'^VIII дом - значение', r'^Денежная ось'],
        )
        cards.append({
            'key': f'house-sign:2:{sign}', 'category': 'money', 'context': 'house-sign',
            'title': f'II дом в знаке {sign}', 'house': 2, 'order': 20 + idx, 'text': text,
        })
    return cards


def parse_planets(heading: str, house: int, order_base: int):
    text = section_text(
        rf'^{re.escape(heading)}\s*$',
        [r'^VIII дом - значение', r'^Планеты в VIII-м доме', r'^Главный по II дому', r'^Главный по VIII дому', r'^Денежная ось'],
    )
    planet_re = '|'.join(map(re.escape, planet_names_ru))
    matches = list(re.finditer(rf'(?P<planet>{planet_re})\s*[–-]\s*', text))
    cards = []
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        planet = match.group('planet')
        content = text[match.end():end].strip()
        cards.append({
            'key': f'planet-house:{planet.lower()}:{house}', 'category': 'money', 'context': 'planet-house',
            'title': f'{planet} в {"II" if house == 2 else "VIII"} доме', 'house': house,
            'planetKey': planet.lower(), 'planetHouse': house, 'order': order_base + i, 'text': content,
        })
    return cards


def parse_rulers(heading: str, context: str, house: int, order_base: int):
    text = section_text(
        rf'^{re.escape(heading)}.*$',
        [r'^Главный по ', r'^Денежная ось'],
    )
    position_re = r'(?:В|Во)\s*(?P<house>[1-9]|1[0-2])-м:\s*'
    matches = list(re.finditer(position_re, text))
    cards = []
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        house_num = int(match.group('house'))
        content = text[match.end():end].strip()
        cards.append({
            'key': f'ruler-house:{context}:{house_num}', 'category': 'money',
            'context': f'ruler-house-{context}', 'title': f'Управитель {context} дома в {house_num}-м доме',
            'house': house, 'rulerHouse': house_num, 'order': order_base + i, 'text': content,
        })
    return cards


cards = []
for key, heading, house, order, ends in [
    ('house:2', r'^II дом - значение\s*$', 2, 10, [r'^Планеты во II-м доме']),
    ('house:8', r'^VIII дом - значение\s*$', 8, 70, [r'^Планеты в VIII-м доме']),
    ('house:5', r'^V дом –.*$', 5, 40, [r'^XI дом –', r'^Главный по V дому']),
    ('house:11', r'^XI дом –.*$', 11, 100, [r'^Главный по V дому']),
]:
    text = paragraph_text(heading, ends)
    if house in (5, 11):
        heading_match = re.search(heading, raw, re.I | re.M)
        if heading_match:
            heading_line = raw[heading_match.start():raw.find('\n', heading_match.start())]
            intro = heading_line.split('–', 1)[1].strip() if '–' in heading_line else ''
            text = ' '.join([intro, text]).strip()
    cards.append({
        'key': key, 'category': 'money', 'context': 'house', 'title': f'{house}-й дом — значение',
        'house': house, 'order': order, 'text': text,
    })

cards.extend(parse_signs())
cards.extend(parse_planets('Планеты во II-м доме', 2, 40))
cards.extend(parse_planets('Планеты в VIII-м доме', 8, 90))
cards.extend(parse_rulers('Главный по II дому (управитель):', 'II', 2, 140))
cards.extend(parse_rulers('Главный по VIII дому (управитель)', 'VIII', 8, 160))
cards.extend(parse_rulers('Главный по V дому (управитель)', 'V', 5, 180))
cards.extend(parse_rulers('Главный по XI дому (управитель)', 'XI', 11, 200))

cards = [card for card in cards if card['text'].strip()]
result = {'source': 'ДЕНЬГИВНАТАЛЬНОЙКАРТЕ(2).pdf', 'cards': cards, 'counts': {}}
for card in cards:
    result['counts'][card['context']] = result['counts'].get(card['context'], 0) + 1
Path('docs/money-studio-source.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'total': len(cards), 'counts': result['counts']}, ensure_ascii=False, indent=2))
