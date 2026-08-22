import html
import re
import sys
from pathlib import Path

text = html.unescape(Path(sys.argv[1]).read_text(encoding="utf-8"))
for match in re.finditer(r'"videoId":"([^"]+)"', text):
    start = max(0, match.start() - 2500)
    block = text[start:match.end() + 200]
    titles = re.findall(r'"title":"([^"\\]*(?:\\.[^"\\]*)*)"', block)
    if not titles:
        titles = re.findall(r'"simpleText":"([^"\\]*(?:\\.[^"\\]*)*)"', block)
    title = titles[-1] if titles else ""
    print(f"{match.group(1)}\t{title}")
