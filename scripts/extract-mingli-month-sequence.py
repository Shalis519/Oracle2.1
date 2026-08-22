import base64
import json
import re
from datetime import datetime, timezone
from pathlib import Path
import requests
from bs4 import BeautifulSoup

cfg = {
    'time': 1778920860,
    'lng': '', 'lat': '', 'utc': 0, 'countrycode': '', 'city': None,
    'id': '', 'cityid': '', 'geonameid': '', 'google_id': '', 'tz': '', 'uauto': '1',
    'addon': {'period': 'month', 'deal': 1, 'ghost_by': 1, 'ctype': '1', 'ghost_view_mode': 0,
              'ghost_mode': 1, 'empty': 0, 'setLocalTime': 0, 'QMDJRotate': 0, 'HoursType': 1,
              'view': 'utf8', 'decade_center': 0, 'calc_type': 1, 'deal_M': 1, 'deal_D': 2, 'deal_Y': 1},
    'template': 'main', 'userid': -1, 'parent': 'calccimien'
}
order = [4, 9, 2, 3, 7, 8, 1, 6]
s = requests.Session()
rows = []
for month in range(1, 13):
    dt = datetime(2026, month, 16, 12, tzinfo=timezone.utc)
    payload = dict(cfg, time=int(dt.timestamp()), addon=dict(cfg['addon'], period='month', deal_M=1))
    token = base64.b64encode(json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode()).decode()
    response = s.get('https://www.mingli.info/cimencard/' + token, timeout=20)
    soup = BeautifulSoup(response.text, 'html.parser')
    cells = soup.select('[id^="DialogContent"]')[:8]
    idx = next((i for i, cell in enumerate(cells) if 'Zhi Fu' in cell.get_text() or '符' in cell.get_text()), None)
    text = soup.get_text(' ', strip=True)
    match = re.search(r'Yin\s+[1-9]', text)
    rows.append({'month': month, 'status': response.status_code, 'yin': match.group(0) if match else None, 'deityPalace': order[idx] if idx is not None else None, 'htmlLength': len(response.text)})
print(json.dumps(rows, ensure_ascii=False, indent=2))
Path('/home/ubuntu/Oracle2.1-repo/scripts/mingli-month-sequence-2026.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
