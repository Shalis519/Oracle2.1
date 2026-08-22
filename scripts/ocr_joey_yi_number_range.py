from pathlib import Path
import subprocess
import sys

pdf = Path(sys.argv[1])
first = int(sys.argv[2])
last = int(sys.argv[3])
out = Path(sys.argv[4])
out.mkdir(parents=True, exist_ok=True)
prefix = out / f"page_{first:03d}"
subprocess.run(["pdftoppm", "-f", str(first), "-l", str(last), "-r", "150", "-jpeg", str(pdf), str(prefix)], check=True)
texts = []
for image in sorted(out.glob(f"page_{first:03d}-*.jpg")):
    text_file = image.with_suffix(".txt")
    subprocess.run(["tesseract", str(image), str(text_file.with_suffix("")), "eng"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    texts.append(f"\n\n===== {image.name} =====\n{text_file.read_text(errors='ignore')}")
(out / f"ocr_pages_{first:03d}_{last:03d}.txt").write_text("".join(texts), encoding="utf-8")
