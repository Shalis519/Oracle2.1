import json
import re
import sys
from pathlib import Path

html = Path(sys.argv[1]).read_text(encoding="utf-8")
match = re.search(r'var ytInitialData = (\{.*?\});</script>', html)
if not match:
    match = re.search(r'ytInitialData"\s*:\s*(\{.*?\})\s*,"ytInitialPlayerResponse', html)
if not match:
    raise SystemExit("ytInitialData not found")
data = json.loads(match.group(1))

def walk(value):
    if isinstance(value, dict):
        if "playlistVideoRenderer" in value:
            item = value["playlistVideoRenderer"]
            vid = item.get("videoId", "")
            title = item.get("title", {}).get("runs", [{}])[0].get("text", "")
            print(f"{vid}\t{title}")
        for child in value.values():
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)

walk(data)
