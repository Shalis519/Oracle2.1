---
name: Qi Men "Нефритовая Дева" & "Девушка, открывающая дверь"
description: Detection rules for the two universal (hour-chart only) maiden structures and the 寄宫 center-lodge trap when a structure targets the center palace.
---
Two universal Qi Men structures — no birth date, no 六冲 filter — scanned over an N-day window straight off the hour chart's palace cells.

"Нефритовая Дева" (玉女守门): signal stem is 丁 (Огонь Инь); Мистики = 乙丙丁. Per outer palace (skip center 5), with H = heaven-plate stem, E = earth-plate stem:
- V1 (strongest): H=丁 & E=丁 & door == Главные Врата.
- V2: H=丁 & E=丁 (ignore Main Gate).
- V3: H=丁 & E∈{乙,丙} & door == Главные Врата.
- V4: H∈{乙,丙} & E=丁 & door == Главные Врата.
(Главные Врата computed per hour — see qimen-main-gate.md.)

"Девушка, открывающая дверь": keyed off the hour stem → a target heaven-plate stem via a fixed table (甲/己→丙, 乙/庚→辛, 丙/辛→乙, 戊/癸→壬, 丁/壬→己). Find the palace whose heaven plate carries that stem; keep it ONLY if it has a good door (休/生/开) AND no-duplication (heaven element ≠ earth element). The hard filter is what keeps it rare (≈one hit per hour otherwise).

**Center-lodge trap (寄宫):** in this chart model `cells[5]` (center) is populated — its heavenStem mirrors its earthStem — so a heaven-plate search loop CAN match palace 5. When it does, remap 5→2 (坤) and read the operators (door, elements) from the LODGED palace 2 cell *before* filtering. Reading `cells[5]` first fails silently: center has door="" so the good-door filter drops a legitimate hit. Any structure that locates a palace by scanning plate stems must apply the 5→2 lodge before evaluating door/void/element operators, not only when formatting the output.

**Why:** first pass evaluated `cells[p]` then remapped only in the returned object, so center-target hours produced zero results (~13% of door-maiden hits were missing).
**How to apply:** compute `lodged = p===5 ? 2 : p` and use `cells[lodged]` for every operator read and the reported palace. Same convention as `adjust()` and `mainGateStar` home-palace mapping in chart.ts.
