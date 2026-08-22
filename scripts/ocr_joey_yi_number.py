from pathlib import Path
import subprocess
import sys

pdf = Path(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
prefix = out / "page"
subprocess.run(["pdftoppm", "-f", "1", "-l", "45", "-r", "150", "-jpeg", str(pdf), str(prefix)], check=True)
texts = []
for image in sorted(out.glob("page-*.jpg")):
    text_file = image.with_suffix(".txt")
    subprocess.run(["tesseract", str(image), str(text_file.with_suffix("")), "eng"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    texts.append(f"\n\n===== {image.name} =====\n{text_file.read_text(errors='ignore')}")
(out / "ocr_pages_001_045.txt").write_text("".join(texts), encoding="utf-8")
