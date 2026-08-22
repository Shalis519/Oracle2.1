from pathlib import Path
import re

path = Path('artifacts/api-server/src/lib/runtimeSchema.ts')
text = path.read_text()
planets = {'sun': 'Солнце', 'moon': 'Луна', 'mercury': 'Меркурий', 'venus': 'Венера', 'mars': 'Марс', 'jupiter': 'Юпитер', 'saturn': 'Сатурн', 'uranus': 'Уран', 'neptune': 'Нептун', 'pluto': 'Плутон'}
aspects = {'conjunction': 'соединение', 'opposition': 'оппозиция', 'square': 'квадрат', 'trine': 'тригон', 'sextile': 'секстиль'}
def repl(match):
    key = match.group(1)
    body, aspect, natal = key.split(':')
    title = f"Транзитный {planets[body]} — {aspects[aspect]} — натальный {planets[natal]}"
    return f"'{title}'"
text, count = re.subn(r"'Долгосрочный транзит ([a-z]+:[a-z]+:[a-z]+)'", repl, text)
if count != 32:
    raise SystemExit(f'expected 32 titles, changed {count}')
path.write_text(text)
