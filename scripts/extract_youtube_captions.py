import html
import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_text(encoding="utf-8")
match = re.search(r'"captionTracks":(\[.*?\])', source)
if not match:
    raise SystemExit("captionTracks not found")
tracks = json.loads(html.unescape(match.group(1)))
track = next((item for item in tracks if item.get("languageCode") == "ru"), tracks[0])
url = track["baseUrl"].replace("\\u0026", "&")
print(url)
Path(sys.argv[2]).write_text(url, encoding="utf-8")
