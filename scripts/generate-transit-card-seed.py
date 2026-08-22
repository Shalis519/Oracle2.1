keys = '''jupiter:square:neptune
jupiter:square:sun
mars:conjunction:uranus
mars:sextile:pluto
mars:square:jupiter
mars:square:sun
mars:trine:neptune
mercury:conjunction:neptune
mercury:conjunction:pluto
mercury:sextile:mars
mercury:sextile:pluto
mercury:square:jupiter
mercury:square:mars
mercury:square:pluto
mercury:square:sun
mercury:trine:saturn
mercury:trine:sun
pluto:trine:jupiter
sun:conjunction:neptune
sun:opposition:saturn
sun:sextile:saturn
sun:sextile:uranus
sun:square:jupiter
sun:square:saturn
sun:trine:jupiter
uranus:conjunction:jupiter
venus:opposition:jupiter
venus:sextile:pluto
venus:sextile:saturn
venus:square:mars
venus:trine:pluto
venus:trine:saturn'''.splitlines()
phrases = {
  'conjunction': 'Соединение усиливает взаимодействие этих тем и делает их заметнее в повседневных решениях.',
  'opposition': 'Оппозиция показывает полярность между этими темами и предлагает искать баланс, а не выбирать крайность.',
  'square': 'Квадрат создаёт напряжение между этими темами и требует более внимательного способа согласовать их.',
  'trine': 'Тригон облегчает взаимодействие этих тем, но результат всё равно зависит от того, замечаете ли Вы возможность и используете ли её.',
  'sextile': 'Секстиль открывает возможность соединить эти темы через собственный шаг, проверку обстоятельств и практическое действие.',
}
rows = []
for key in keys:
    body, aspect, natal = key.split(':')
    text = '{technicalLine}\\n\\nВ этот период может стать заметнее взаимодействие между темами {transitEntityThemes} и {natalEntityThemes}, проявляющееся в сферах {transitHouseThemes} и {natalHouseThemes}. ' + phrases[aspect] + ' Это не указывает на обязательное событие: полезно наблюдать факты, проверять решения и выбирать такой шаг, который поддерживает Ваши долгосрочные цели.'
    title = f'Долгосрочный транзит {key}'
    rows.append(f"      ('long_term_transit', 'major_aspect', '{key}', '{title}', '{text}', 'Авторская карточка Oracle Studio по проверочному шестимесячному прогнозу, v1')")
print('  await db.execute(sql`\n    INSERT INTO forecast_text_templates (category, context, key, title, text, source_note)\n    VALUES\n' + ',\n'.join(rows) + "\n    ON CONFLICT (category, context, key) DO NOTHING\n  `);")
