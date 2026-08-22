import { useState } from "react";
import { Link } from "wouter";
import { useGetQimen, getGetQimenQueryKey, useGetTodayActivations, getGetTodayActivationsQueryKey } from "@workspace/api-client-react";
import type {
  QimenStructure,
  JiFuWish,
  QimenJadeMaiden,
  QimenBirthChart,
  QimenMonthChart,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Compass,
  ScrollText,
  Target,
  Eye,
  Sparkles,
  AlertCircle,
  Info,
  Heart,
  Flame,
} from "lucide-react";

const HOUR_RANGES: Record<string, string> = {
  "Крыса": "23:00–01:00",
  "Бык": "01:00–03:00",
  "Тигр": "03:00–05:00",
  "Кролик": "05:00–07:00",
  "Дракон": "07:00–09:00",
  "Змея": "09:00–11:00",
  "Лошадь": "11:00–13:00",
  "Коза": "13:00–15:00",
  "Обезьяна": "15:00–17:00",
  "Петух": "17:00–19:00",
  "Собака": "19:00–21:00",
  "Свинья": "21:00–23:00",
};

const WALK_RULES: string[] = [
  "Выходите точно в указанный двухчасовой интервал (час). Раньше или позже энергия уже другая.",
  "Двигайтесь в указанном направлении от своего дома или текущей точки. Пройдите ощутимое расстояние, не разворачивайтесь сразу.",
  "Перед выходом чётко, вслух озвучьте своё намерение по теме активации.",
  "Будьте активны и вовлечены: прогулка должна быть осознанной, а не формальной.",
  "Не совмещайте в одной прогулке цели, которые противоречат друг другу.",
];

const JIFU_INTRO: string[] = [
  "Дух/Божество Джи Фу - приносит Счастье и Удачу во всех сферах жизни, устраняет негатив, помогает в любых, даже в самых сложных, ситуациях.",
  "Божество особенно благоприятно если нужно достичь цели быстро и без проблем.",
  "Если Вы не знаете, к какому из Божеств Вам обратиться, тогда смело обращайтесь к Главному Духу, ДЖИ ФУ",
  "Обращаемся если нужна срочная помощь в какой-то определенной сфере:",
];

const JIFU_AREAS: string[] = [
  "нужна помощь в решении любого вопроса (здоровье, сложности в семье, с детьми, в бизнесе)",
  "нужна помощь в финансовых вопросах",
  "хотите повышения или увеличение продаж",
  "нужна помощь в решении спорных вопросов с начальством или любыми вышестоящими органами",
  "нужен кредит или взять ипотеку",
  "нужна протекция, покровительство или помощь от вышестоящих лиц",
  "нужна помощь в отношениях",
];

const JIFU_OUTRO = "Джи Фу помогает решить абсолютно любой вопрос.";

const JIFU_ACTIVATION: string[] = [
  "Чтобы провести активации вам нужен будет компас для того чтобы определить сторону света где находится Джи Фу на нужный период времени, расположиться к этому направлению спиной.",
  "Обязательно нужно четко сформулировать свое желание, медитировать и визуализировать в минимальных деталях, укажите место, сроки, стоимость, размеры, год выпуска, цвет, когда, где, и т.д.",
  "Следует помнить, что чем чаще Вы общаетесь с духом – тем быстрее будут исполняться Ваши желания, поэтому не забывать вовремя проводить активации.",
];

const GEN_AREAS: string[] = [
  "операциях с недвижимостью",
  "романтических отношениях",
  "учёбе, экзаменах и презентациях",
  "работе с документами",
  "подписании контрактов",
  "проведении свадеб",
  "заключении соглашений",
  "начале новых проектов",
  "привлечении денежных поступлений",
  "приумножении богатства",
  "получении помощи",
  "защите",
  "нейтрализации негатива",
  "подаче прошений",
  "решении карьерных вопросов",
  "разрешении споров и разногласий",
  "продвижении по службе",
  "выигрышах",
  "получении финансовых доходов",
];

const GEN_NOTE =
  "Перед проведением активации ЧЁТКО формулируйте цель и желание!!";

const GEN_PROCESS: string[] = [
  "Найдите нужный сектор в доме",
  "Поставьте активатор в этом секторе в указанную двухчасовку минимум на 1,5 часа.",
];

const JADE_INTRO =
  "Нефритовая Дева подходит для ситуаций, где важно установить личный контакт и вызвать расположение: для знакомства и поиска партнёра, развития уже существующих отношений, презентаций, праздников, свиданий и деловых встреч. Её можно выбирать, когда нужно мягко привлечь к себе внимание, понравиться собеседнику или создать доброжелательную атмосферу общения.";

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS_RU[Number(m[2]) - 1]}`;
}

const BIRTH_CHART_LAYOUT = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const PALACE_LAYOUT_ROWS = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const PALACE_INFO_RU: Record<number, { direction: string; element: string; branch: string }> = {
  1: { direction: "Север", element: "Вода", branch: "子 Крыса" },
  2: { direction: "Юго-запад", element: "Земля", branch: "未 Коза" },
  3: { direction: "Восток", element: "Дерево", branch: "卯 Кролик" },
  4: { direction: "Юго-восток", element: "Дерево", branch: "巳 Змея" },
  5: { direction: "Центр", element: "Земля", branch: "—" },
  6: { direction: "Северо-запад", element: "Металл", branch: "亥 Свинья" },
  7: { direction: "Запад", element: "Металл", branch: "酉 Петух" },
  8: { direction: "Северо-восток", element: "Земля", branch: "丑 Бык" },
  9: { direction: "Юг", element: "Огонь", branch: "午 Лошадь" },
};
const TOP_RING = [
  { left: "ЮВ", center: "巳 Змея", right: "" },
  { left: "Огонь 火", center: "Юг", right: "午 Лошадь" },
  { left: "", center: "未 Коза", right: "ЮЗ" },
];
const BOTTOM_RING = [
  { left: "СВ", center: "丑 Бык", right: "" },
  { left: "Вода 水", center: "Север", right: "子 Крыса" },
  { left: "", center: "亥 Свинья", right: "СЗ" },
];
const LEFT_PERIMETER = [
  { parts: ["辰", "Дракон", "Дерево", "巽"] },
  { parts: ["Дерево", "震", "В", "卯", "Кролик"] },
  { parts: ["土", "Земля", "寅", "Тигр"] },
];
const RIGHT_PERIMETER = [
  { parts: ["土", "Земля", "申", "Обезьяна"] },
  { parts: ["Металл", "兑", "З", "酉", "Петух"] },
  { parts: ["戌", "Собака", "Металл", "乾"] },
];
const DEITY_NAME_RU: Record<string, string> = {
  "值符": "Главный Дух",
  "螣蛇": "Змея",
  "太阴": "Великий Инь",
  "六合": "Шесть Гармоний",
  "白虎": "Белый Тигр",
  "玄武": "Чёрная Черепаха",
  "九地": "Девять Земель",
  "九天": "Девять Небес",
};
const STAR_NAME_RU: Record<string, string> = {
  "天蓬": "Небесная Трава",
  "天芮": "Небесная Трава",
  "天冲": "Небесный Агрессор",
  "天辅": "Небесный Помощник",
  "天英": "Небесный Герой",
  "天禽": "Небесная Птица",
  "天心": "Небесное Сердце",
  "天柱": "Небесный Столп",
  "天任": "Небесный Чиновник",
};
const DOOR_NAME_RU: Record<string, string> = {
  "休门": "Врата Отдых",
  "生门": "Врата Жизнь",
  "伤门": "Врата Ранение",
  "杜门": "Врата Тайник",
  "景门": "Врата Сцена",
  "死门": "Врата Смерть",
  "惊门": "Врата Шок",
  "开门": "Врата Открытие",
};
	const DOOR_ELEMENT: Record<string, string> = {
	  "休门": "water", "生门": "earth", "伤门": "wood", "杜门": "wood",
	  "景门": "fire", "死门": "earth", "惊门": "metal", "开门": "metal",
	};
	const STAR_ELEMENT: Record<string, string> = {
	  "天蓬": "water", "天芮": "earth", "天冲": "wood", "天辅": "wood",
	  "天英": "fire", "天禽": "earth", "天心": "metal", "天柱": "metal", "天任": "earth",
	};
	const STEM_ELEMENT: Record<string, string> = {
	  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth", 己: "earth",
	  庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
	};
	const ELEMENT_TEXT_CLASS: Record<string, string> = {
	  wood: "text-emerald-300",
	  fire: "text-red-300",
	  earth: "text-amber-700",
	  metal: "text-slate-100",
	  water: "text-sky-300",
	};
	const elementTextClass = (element?: string) => ELEMENT_TEXT_CLASS[element || ""] || "text-cyan-100";

	const STEM_NAME_RU: Record<string, string> = {

  甲: "Цзя", 乙: "И", 丙: "Бин", 丁: "Дин", 戊: "У",
  己: "Цзи", 庚: "Гэн", 辛: "Синь", 壬: "Жэнь", 癸: "Гуй",
};

function BirthChartCard({ chart, title = "Личная карта Ци Мэнь", description = "Часовой расклад на момент рождения" }: { chart: QimenBirthChart | QimenMonthChart; title?: string; description?: string }) {
  const byPalace = new Map(chart.cells.map((cell) => [cell.palace, cell]));
  const periodGz = "monthGz" in chart ? chart.monthGz : chart.hourGz;
  return (
    <Card className="bg-card/40 backdrop-blur-md border-cyan-400/30">
      <CardHeader className="pb-3">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-300" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
            <span>{"monthGz" in chart ? "Столп месяца" : "Столп часа"}: {periodGz}</span>
          <span>Главные Врата: {chart.zhiShiDoor}</span>
          <span>Главная звезда: {chart.zhiFuStar}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <div className="grid w-full grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-stretch overflow-hidden rounded-none sm:grid-cols-[1.75rem_minmax(0,1fr)_1.75rem]">
            <div className="flex w-6 shrink-0 flex-col overflow-hidden bg-slate-200 text-[10px] font-semibold leading-none text-slate-900 sm:w-7 sm:text-xs">
              {LEFT_PERIMETER.map((item) => (
                <div key={`left-${item.parts.join("-")}`} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-1 sm:px-2">
                  <span className="whitespace-nowrap" style={{ transform: "rotate(-90deg)", wordSpacing: "0.35em" }}>{item.parts.join(" ")}</span>
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-3 overflow-hidden bg-slate-200 text-[10px] font-semibold leading-none text-slate-900 sm:text-xs">
                {TOP_RING.map((item) => (
                  <div key={`${item.left}-${item.center}-${item.right}`} className="grid h-6 min-w-0 grid-cols-3 items-center px-1 sm:h-7 sm:px-2">
                    <span className="whitespace-nowrap text-left">{item.left}</span>
                    <span className="whitespace-nowrap text-center">{item.center}</span>
                    <span className="whitespace-nowrap text-right">{item.right}</span>
                  </div>
                ))}
              </div>
              <div className="grid aspect-square min-w-0 grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2">
                {BIRTH_CHART_LAYOUT.map((palace) => {
                  const cell = byPalace.get(palace);
                  if (!cell) {
                    return <div key={palace} className="min-h-0 min-w-0 rounded-none border border-cyan-400/10 bg-cyan-400/5" />;
                  }
                  if (palace === 5) {
                    return (
                      <div key={palace} className="min-h-0 min-w-0 overflow-hidden rounded-none border border-cyan-300/20 bg-background/20 p-2 text-center text-[10px] leading-tight sm:text-xs">
                        <div className="mt-5 text-2xl font-semibold leading-none text-cyan-100">{chart.yin ? "Инь" : "Ян"} {chart.ju}</div>
                        <div className="mt-3 text-cyan-200">{"monthGz" in chart ? "Расклад месяца" : "Расклад часа"}</div>
                        <div className="mt-1 text-[9px] text-cyan-300/70">Система: Чжи Жунь</div>
                        <div className="mt-1 text-[9px] text-cyan-300/70">{periodGz}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={palace} className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-none border p-2 text-[10px] leading-tight transition-colors sm:text-xs ${cell.isDestinyPalace ? "border-emerald-300/80 bg-emerald-400/10 shadow-[inset_0_0_18px_rgba(110,231,183,0.12)]" : "border-cyan-400/20 bg-background/30"}`}>
                      <div className="flex min-w-0 items-start justify-end text-cyan-200 font-semibold"><span className="text-sm leading-none sm:text-base">{cell.trigram}</span></div>
                      {cell.isDestinyPalace ? <div className="mt-1 inline-flex rounded border border-emerald-300/60 bg-emerald-300/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-200">Дворец Судьбы</div> : null}
                      <div className="mt-2 grid min-h-0 min-w-0 flex-1 grid-rows-[1fr_1fr] gap-2 overflow-hidden text-center">
                        <div className="grid min-h-0 min-w-0 grid-cols-3 gap-1">
                          <div className="min-w-0 overflow-hidden"><div className="text-base leading-none text-cyan-100 sm:text-lg">{cell.deity || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{DEITY_NAME_RU[cell.deity] || cell.deity || "Дух"}</div></div>
                          <div className="min-w-0 overflow-hidden"><div className={`text-base leading-none sm:text-lg ${elementTextClass(DOOR_ELEMENT[cell.door])}`}>{cell.door || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{DOOR_NAME_RU[cell.door] || cell.door || "Врата"}</div></div>
                          <div className="min-w-0 overflow-hidden"><div className={`text-base leading-none sm:text-lg ${elementTextClass(STEM_ELEMENT[cell.heavenStem])}`}>{cell.heavenStem || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{STEM_NAME_RU[cell.heavenStem] || cell.heavenStem || "Небо"}</div></div>
                        </div>
                        <div className="grid min-h-0 min-w-0 grid-cols-3 gap-1 text-center">
                          <div className="min-w-0 overflow-hidden"><div className={`text-base leading-none sm:text-lg ${elementTextClass(STAR_ELEMENT[cell.star])}`}>{cell.star || "—"}</div><div className="mt-1 min-h-[1.35rem] whitespace-normal break-normal text-[7px] leading-[1.05] text-cyan-300/70 sm:text-[8px]">{STAR_NAME_RU[cell.star] || cell.star || "Звезда"}</div></div>
                          {cell.pairedStar ? <div className="min-w-0 overflow-hidden"><div className={`text-base leading-none sm:text-lg ${elementTextClass(STAR_ELEMENT[cell.pairedStar])}`}>{cell.pairedStar}</div><div className="mt-1 min-h-[1.35rem] whitespace-normal break-normal text-[7px] leading-[1.05] text-cyan-300/70 sm:text-[8px]">{STAR_NAME_RU[cell.pairedStar] || cell.pairedStar}</div></div> : <div aria-hidden="true" />}
                          <div className="min-w-0 overflow-hidden"><div className={`text-base leading-none sm:text-lg ${elementTextClass(STEM_ELEMENT[cell.earthStem])}`}>{cell.earthStem || "—"}</div><div className="mt-1 min-h-[1.35rem] break-words text-[8px] leading-[1.05] text-cyan-300/70 sm:text-[9px]">{STEM_NAME_RU[cell.earthStem] || cell.earthStem || "Земля"}</div></div>
                        </div>
                      </div>
                      {cell.isVoid ? <p className="mt-1 h-4 shrink-0 overflow-hidden text-amber-200">Пустота</p> : <div className="mt-1 h-4 shrink-0" aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 overflow-hidden bg-slate-200 text-[10px] font-semibold leading-none text-slate-900 sm:text-xs">
                {BOTTOM_RING.map((item) => (
                  <div key={`${item.left}-${item.center}-${item.right}`} className="grid h-6 min-w-0 grid-cols-3 items-center px-1 sm:h-7 sm:px-2">
                    <span className="whitespace-nowrap text-left">{item.left}</span>
                    <span className="whitespace-nowrap text-center">{item.center}</span>
                    <span className="whitespace-nowrap text-right">{item.right}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex w-6 shrink-0 flex-col overflow-hidden bg-slate-200 text-[10px] font-semibold leading-none text-slate-900 sm:w-7 sm:text-xs">
              {RIGHT_PERIMETER.map((item) => (
                <div key={`right-${item.parts.join("-")}`} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-1 sm:px-2">
                  <span className="whitespace-nowrap" style={{ transform: "rotate(90deg)", wordSpacing: "0.35em" }}>{item.parts.join(" ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StructureCard({ s }: { s: QimenStructure }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card/40 backdrop-blur-md border-emerald-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-serif text-lg">
              Структура «{s.structureName}»
            </CardTitle>
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              {formatDate(s.date)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <Target className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/80" />
            <p className="leading-relaxed">
              <span className="font-medium">Цель:</span> {s.goal}.
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Compass className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/80" />
            <p className="leading-relaxed">
              Сектор{" "}
              <span className="font-semibold text-emerald-300">
                {s.direction}
              </span>{" "}
              в {s.hourLabel}.
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/80" />
            <p className="leading-relaxed">
              <span className="font-medium">Активация:</span> {s.activation}.{" "}
              <span className="text-muted-foreground">
                {s.starName}, {s.wonderName}.
              </span>
            </p>
          </div>

          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
              <Eye className="w-3.5 h-3.5" />
              Знаки
            </div>
            <ul className="list-disc list-outside space-y-1 pl-5 text-sm leading-relaxed">
              {s.signs.map((sign, i) => (
                <li key={i}>{sign}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm leading-relaxed border-l-2 border-emerald-500/50 pl-3 py-1">
            <span className="font-medium">Результат:</span> {s.result}
          </p>

          {s.note ? (
            <p className="text-xs italic text-muted-foreground">{s.note}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function wishGuidance(w: JiFuWish): string {
  const y = w.matchYear;
  const m = w.matchMonth;
  const d = w.matchDay;
  // hour is always part of the match (it is the anchor).
  if (m && !y && !d)
    return "Просить помощи в вопросах, которые должны решиться в течении месяца и надо получить срочно промежуточный результат, но не конечный.";
  if (y && d && !m)
    return "Просить помощи в делах, решении вопросов, связанных с длительными процессами, которые не требуют сиюминутного решения, но их надо сдвинуть с места в течении суток.";
  if (m && d && !y)
    return "Просить помощи в срочных, быстрых делах, текущие и промежуточные процессы.";
  if (y && !m && !d)
    return "Просить помощи в делах, связанных с длительными процессами которые не требуют сиюминутного решения, но их надо сдвинуть с места в течении суток.";
  if (d && !y && !m)
    return "Просить помощи в быстрых делах, текущие промежуточные процессы.";
  return "";
}

function JiFuWishCard({ w }: { w: JiFuWish }) {
  const scales: string[] = ["час"];
  if (w.matchDay) scales.push("день");
  if (w.matchMonth) scales.push("месяц");
  if (w.matchYear) scales.push("год");

  const guidance = wishGuidance(w);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-card/40 backdrop-blur-md border-amber-400/30">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-amber-200">{w.hourLabel}</span>{" "}
                <span className="font-semibold text-amber-200">{w.direction}</span> сидеть
                спиной
              </p>
              {guidance ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {guidance}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200">
              {formatDate(w.date)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Совпадение секторов:</span>
            {scales.map((label) => (
              <span
                key={label}
                className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200/90"
              >
                {label}
              </span>
            ))}
            <span className="text-base leading-none" aria-label={`Сила взаимодействия: ${w.strength}`}>
              {"\u{1F9D8}\u200D\u2640\uFE0F".repeat(w.strength)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function JadeMaidenCard({ m }: { m: QimenJadeMaiden }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-card/40 backdrop-blur-md border-rose-400/30">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed">
              Сектор{" "}
              <span className="font-semibold text-rose-200">{m.direction}</span>{" "}
              в <span className="font-semibold text-rose-200">{m.hourLabel}</span>.
            </p>
            <span className="shrink-0 rounded-full bg-rose-400/15 px-3 py-1 text-xs font-medium text-rose-200">
              {formatDate(m.date)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-xs text-rose-200/90">
              Небо: {m.heavenStemName}
            </span>
            <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-xs text-rose-200/90">
              Земля: {m.earthStemName}
            </span>
            <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-xs text-rose-200/90">
              {m.doorName}
            </span>
            {m.isMainGate ? (
              <span className="rounded-full bg-rose-400/20 px-2 py-0.5 text-xs font-medium text-rose-100">
                Главные Врата
              </span>
            ) : null}
            {m.door === "杜门" ? (
              <span className="rounded-full bg-rose-400/20 px-2 py-0.5 text-xs text-rose-100">
                Подходит для тайных встреч и переговоров, когда важно остаться незамеченными
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}



export default function QimenPage() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [jifuInfoOpen, setJifuInfoOpen] = useState(false);
  const [jadeInfoOpen, setJadeInfoOpen] = useState(false);
  const [genInfoOpen, setGenInfoOpen] = useState(false);
  const { data, isLoading, isError } = useGetQimen({
    query: { retry: false, queryKey: getGetQimenQueryKey() },
  });
  const { data: activations } = useGetTodayActivations({
    query: { queryKey: getGetTodayActivationsQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="max-w-xl border-destructive/30 bg-card/40">
          <CardContent className="flex items-start gap-3 p-6 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-foreground">Не удалось загрузить расчёт Ци Мэнь</p>
              <p className="mt-1">Сервер не вернул данные Джи Фу и личных структур. Обновите страницу после завершения деплоя API.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasBirthDate = data?.hasBirthDate ?? false;
  const structures = data?.structures ?? [];
  const jiFuWishes = data?.jiFuWishes ?? [];
  const jadeMaidens = data?.jadeMaidens ?? [];
  const windowDays = data?.windowDays ?? 14;
  const maidenWindowDays = data?.maidenWindowDays ?? 7;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold mb-1">
              Ци Мэнь Дунь Цзя
            </h1>
            <p className="text-sm text-muted-foreground">
              Индивидуальные структуры по благоприятным направлениям и часам.
            </p>
          </div>
          <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-2">
                <ScrollText className="w-4 h-4" />
                Правила прогулок
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-emerald-400" />
                  Правила прогулок
                </DialogTitle>
              </DialogHeader>
              <ol className="list-decimal list-outside space-y-2 pl-5 text-sm leading-relaxed">
                {WALK_RULES.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ol>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>


      {data?.birthChart ? (
        <section className="space-y-4">
          <BirthChartCard chart={data.birthChart} />
        </section>
      ) : null}

      {/* Исполнение желаний с Джи Фу, универсально, без привязки к дате рождения */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h2 className="text-xl font-serif font-semibold">
            <Dialog open={jifuInfoOpen} onOpenChange={setJifuInfoOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 underline decoration-dotted decoration-amber-300/60 underline-offset-4 hover:text-amber-200 transition-colors"
                >
                  Исполнение желаний с Джи Фу
                  <Info className="w-4 h-4 text-amber-300/80" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    Исполнение желаний с Джи Фу
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm leading-relaxed">
                  {JIFU_INTRO.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  <ul className="list-disc list-outside space-y-1.5 pl-5">
                    {JIFU_AREAS.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                  <p>{JIFU_OUTRO}</p>
                  <p className="font-semibold text-amber-200">
                    Как проводить активацию:
                  </p>
                  {JIFU_ACTIVATION.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </h2>
        </div>

        {jiFuWishes.length > 0 ? (
          <div className="space-y-3">
            {jiFuWishes.map((w, i) => (
              <JiFuWishCard key={`${w.date}-${w.hourBranch}-${i}`} w={w} />
            ))}
          </div>
        ) : (
          <Card className="bg-card/40 backdrop-blur-md">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              На сегодня сильных совпадений сектора Джи Фу не найдено.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Нефритовая Дева: поиск выполняется только в часовых раскладах */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-300" />
          <h2 className="text-xl font-serif font-semibold">
            <Dialog open={jadeInfoOpen} onOpenChange={setJadeInfoOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 underline decoration-dotted decoration-rose-300/60 underline-offset-4 hover:text-rose-200 transition-colors"
                >
                  Нефритовая Дева
                  <Info className="w-4 h-4 text-rose-300/80" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-300" />
                    Нефритовая Дева
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm leading-relaxed">
                  <p>{JADE_INTRO}</p>
                </div>
              </DialogContent>
            </Dialog>
          </h2>
        </div>
        {jadeMaidens.length > 0 ? (
          <div className="space-y-3">
            {jadeMaidens.map((m, i) => (
              <JadeMaidenCard
                key={`${m.date}-${m.hourBranch}-${m.dom}-${i}`}
                m={m}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-card/40 backdrop-blur-md">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              На ближайшие {maidenWindowDays} {pluralDays(maidenWindowDays)}{" "}
              структур «Нефритовая Дева» не найдено.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Персональные структуры «Три Генерала», требуют дату рождения */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-semibold">
          <Dialog open={genInfoOpen} onOpenChange={setGenInfoOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 underline decoration-dotted decoration-emerald-300/60 underline-offset-4 hover:text-emerald-200 transition-colors"
              >
                Структуры «Три Генерала»
                <Info className="w-4 h-4 text-emerald-300/80" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  Структура «Три Генерала»
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm leading-relaxed">
                <p className="font-medium text-emerald-200">Используем для помощи в:</p>
                <ul className="list-disc list-outside space-y-1.5 pl-5">
                  {GEN_AREAS.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                <p className="font-medium text-emerald-200">{GEN_NOTE}</p>
                <p className="font-semibold text-emerald-200">Процесс активации:</p>
                <ol className="list-decimal list-outside space-y-1.5 pl-5">
                  {GEN_PROCESS.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>
            </DialogContent>
          </Dialog>
        </h2>

        {!hasBirthDate ? (
          <Card className="bg-card/40 backdrop-blur-md">
            <CardContent className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-muted-foreground max-w-md text-sm">
                Персональные структуры рассчитываются по дате вашего рождения.
                Пожалуйста, заполните её в настройках профиля.
              </p>
              <Link href="/profile">
                <Button size="lg" className="mt-1">
                  Перейти в профиль
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : structures.length > 0 ? (
          <div className="space-y-4">
            {structures.map((s, i) => (
              <StructureCard key={`${s.date}-${s.hourBranch}-${s.dom}-${i}`} s={s} />
            ))}
          </div>
        ) : (
          <Card className="bg-card/40 backdrop-blur-md">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              На ближайшие {windowDays} {pluralDays(windowDays)} благоприятных
              структур не найдено. Загляните позже, структуры появляются по
              благоприятным дням и часам.
            </CardContent>
          </Card>
        )}
      </section>

      {activations && activations.items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="bg-card/40 backdrop-blur-md shadow-lg border-secondary/30">
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2 text-secondary">
                <Flame className="w-6 h-6" />
                Общие активизации дня
              </CardTitle>
              <CardDescription>Энергетические события сегодняшнего дня и часы их активации.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activations.items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-background/60 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-3">
                    <h3 className="font-serif font-bold text-lg text-primary">{item.title}</h3>
                    <span className="text-sm text-muted-foreground shrink-0">
                      Час {item.hour}{HOUR_RANGES[item.hour] ? ` · ${HOUR_RANGES[item.hour]}` : ""}
                    </span>
                  </div>
                  {item.audience && (
                    <p className="text-sm text-muted-foreground italic mb-3">{item.audience}</p>
                  )}
                  <div className="space-y-2">
                    {item.paragraphs.map((p, i) => (
                      <p key={i} className="leading-relaxed text-sm">{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
