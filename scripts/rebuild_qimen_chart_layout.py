from pathlib import Path

path = Path('/home/ubuntu/Oracle2.1-repo/artifacts/web/src/pages/qimen.tsx')
text = path.read_text()
start = text.index('        <div className="grid grid-cols-[minmax(4rem,auto)')
end = text.index('      </CardContent>', start)
new_block = '''        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {PALACE_LAYOUT_ROWS[0].map((palace) => {
              const info = PALACE_INFO_RU[palace];
              return <div key={`top-${palace}`} className="flex min-w-0 flex-col justify-end pb-0 text-center text-[8px] font-semibold uppercase leading-tight tracking-wide text-cyan-200 sm:text-[10px]">{info.direction}<span className="font-normal normal-case text-cyan-300/70">{info.element}</span><span className="font-normal normal-case text-cyan-300/60">{info.branch}</span></div>;
            })}
          </div>
          <div className="flex w-full items-stretch gap-1.5 sm:gap-2">
            <div className="flex w-5 shrink-0 flex-col sm:w-6">
              {LEFT_PERIMETER.map((item) => (
                <div key={`left-${item.branch}`} className="flex min-h-0 flex-1 items-center justify-center overflow-visible text-[8px] font-semibold uppercase leading-tight tracking-wide text-cyan-200 sm:text-[10px]">
                  <span style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap" }}>{item.element} · {item.branch}</span>
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid aspect-square min-w-0 grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2">
                {BIRTH_CHART_LAYOUT.map((palace) => {
                  const cell = byPalace.get(palace);
                  if (!cell) {
                    return <div key={palace} className="min-h-0 min-w-0 rounded-lg border border-cyan-400/10 bg-cyan-400/5" />;
                  }
                  if (palace === 5) {
                    return (
                      <div key={palace} className="min-h-0 min-w-0 overflow-hidden rounded-lg border border-cyan-300/20 bg-background/20 p-2 text-center text-[10px] leading-tight sm:text-xs">
                        <div className="mt-5 text-2xl font-semibold leading-none text-cyan-100">{chart.yin ? "Инь" : "Ян"} {chart.ju}</div>
                        <div className="mt-3 text-cyan-200">{"monthGz" in chart ? "Расклад месяца" : "Расклад часа"}</div>
                        <div className="mt-1 text-[9px] text-cyan-300/70">Система: Чжи Жунь</div>
                        <div className="mt-1 text-[9px] text-cyan-300/70">{periodGz}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={palace} className={`min-w-0 overflow-hidden rounded-lg border p-2 text-[10px] leading-tight transition-colors sm:text-xs ${cell.isDestinyPalace ? "border-emerald-300/80 bg-emerald-400/10 shadow-[inset_0_0_18px_rgba(110,231,183,0.12)]" : "border-cyan-400/20 bg-background/30"}`}>
                      <div className="flex min-w-0 items-start justify-end text-cyan-200 font-semibold"><span className="text-sm leading-none sm:text-base">{cell.trigram}</span></div>
                      {cell.isDestinyPalace ? <div className="mt-1 inline-flex rounded border border-emerald-300/60 bg-emerald-300/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-200">Дворец Судьбы</div> : null}
                      <div className="mt-2 grid min-w-0 gap-2 text-center">
                        <div className="grid min-w-0 grid-cols-2 gap-1">
                          <div className="min-w-0"><div className="text-base leading-none text-cyan-100 sm:text-lg">{cell.deity || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{DEITY_NAME_RU[cell.deity] || cell.deity || "Дух"}</div></div>
                          <div className="min-w-0"><div className="text-base leading-none text-cyan-100 sm:text-lg">{cell.heavenStem || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{STEM_NAME_RU[cell.heavenStem] || cell.heavenStem || "Небо"}</div></div>
                        </div>
                        <div className="grid min-w-0 grid-cols-3 gap-1 text-center">
                          <div className="min-w-0"><div className="text-base leading-none text-cyan-100 sm:text-lg">{cell.star || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{STAR_NAME_RU[cell.star] || cell.star || "Звезда"}{cell.pairedStar ? ` / ${STAR_NAME_RU[cell.pairedStar] || cell.pairedStar}` : ""}</div></div>
                          <div className="min-w-0"><div className="text-base leading-none text-cyan-100 sm:text-lg">{cell.door || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{DOOR_NAME_RU[cell.door] || cell.door || "Врата"}</div></div>
                          <div className="min-w-0"><div className="text-base leading-none text-cyan-100 sm:text-lg">{cell.earthStem || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{STEM_NAME_RU[cell.earthStem] || cell.earthStem || "Земля"}</div></div>
                        </div>
                      </div>
                      {cell.isVoid ? <p className="mt-2 text-amber-200">Пустота</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex w-5 shrink-0 flex-col sm:w-6">
              {RIGHT_PERIMETER.map((item) => (
                <div key={`right-${item.branch}`} className="flex min-h-0 flex-1 items-center justify-center overflow-visible text-[8px] font-semibold uppercase leading-tight tracking-wide text-cyan-200 sm:text-[10px]">
                  <span style={{ transform: "rotate(90deg)", whiteSpace: "nowrap" }}>{item.element} · {item.branch}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {PALACE_LAYOUT_ROWS[2].map((palace) => {
              const info = PALACE_INFO_RU[palace];
              return <div key={`bottom-${palace}`} className="flex min-w-0 flex-col pt-0 text-center text-[8px] font-semibold uppercase leading-tight tracking-wide text-cyan-200 sm:text-[10px]">{info.direction}<span className="font-normal normal-case text-cyan-300/70">{info.element}</span><span className="font-normal normal-case text-cyan-300/60">{info.branch}</span></div>;
            })}
          </div>
        </div>
'''
path.write_text(text[:start] + new_block + text[end:])
