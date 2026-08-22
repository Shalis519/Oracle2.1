import re
import sys
import zipfile
from xml.etree import ElementTree as ET

path = sys.argv[1]
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(path) as z:
    root = ET.fromstring(z.read('word/document.xml'))
labels = {'Солнце': 'sun', 'Луна': 'moon', 'Меркурий': 'mercury', 'Венера': 'venus', 'Марс': 'mars', 'Юпитер': 'jupiter', 'Сатурн': 'saturn', 'Уран': 'uranus', 'Нептун': 'neptune', 'Плутон': 'pluto'}
aspects = {'соединение': 'conjunction', 'оппозиция': 'opposition', 'квадрат': 'square', 'тригон': 'trine', 'секстиль': 'sextile'}
keys = set()
for p in root.findall('.//w:p', ns):
    text = ''.join(t.text or '' for t in p.findall('.//w:t', ns))
    m = re.search(r'транзитн(?:ый|ая|ое)\s+(Солнце|Луна|Меркурий|Венера|Марс|Юпитер|Сатурн|Уран|Нептун|Плутон).*?образует\s+(соединение|оппозиция|квадрат|тригон|секстиль).*?натальн(?:ый|ая|ое|ой|ым|ую)\s+(Солнце|Луна|Меркурий|Венера|Марс|Юпитер|Сатурн|Уран|Нептун|Плутон)', text, re.I)
    if m:
        keys.add(f'{labels[m.group(1)]}:{aspects[m.group(2)]}:{labels[m.group(3)]}')
if not keys:
    for p in root.findall('.//w:p', ns):
        text = ''.join(t.text or '' for t in p.findall('.//w:t', ns))
        if 'транзит' in text.lower(): print(repr(text))
else:
    print('\n'.join(sorted(keys)))
