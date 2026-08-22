from pathlib import Path

path = Path('artifacts/api-server/src/lib/runtimeSchema.ts')
text = path.read_text()
block = Path('/tmp/transit-card-seed.txt').read_text()
marker = '  await ensureApprovedForecastTemplateSeeds();'
if "Авторская карточка Oracle Studio по проверочному шестимесячному прогнозу, v1" in text:
    raise SystemExit('transit card seed already present')
if marker not in text:
    raise SystemExit('seed marker not found')
path.write_text(text.replace(marker, block + '\n' + marker, 1))
