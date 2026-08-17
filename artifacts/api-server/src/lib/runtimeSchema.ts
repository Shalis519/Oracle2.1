import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

/**
 * Creates small runtime support tables that are not part of the deployment shell
 * workflow. Every statement is idempotent and safe to run on every API start.
 */
export async function ensureRuntimeSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_read_state (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      last_read_message_id INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS chat_read_state_user_id_idx
    ON chat_read_state (user_id)
  `);
  await db.execute(sql`
    ALTER TABLE ontology_entity_profiles
      ADD COLUMN IF NOT EXISTS plants JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS crystals JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS jewelry JSONB NOT NULL DEFAULT '[]'::jsonb
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lunar_interpretations (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT 'В разработке',
      source_note TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT lunar_interpretation_category_key_unique UNIQUE (category, key)
    )
  `);
  await db.execute(sql`
    INSERT INTO lunar_interpretations (category, key, title, text)
    SELECT 'house', gs::text, gs::text || '-й дом лунара', 'В разработке'
    FROM generate_series(1, 12) AS gs
    ON CONFLICT (category, key) DO UPDATE
      SET title = EXCLUDED.title, text = 'В разработке', source_note = NULL, updated_at = NOW()
      WHERE lunar_interpretations.source_note = 'Адаптация по разделу «Луна в домах» из книги по лунным циклам, v1'
  `);
  await db.execute(sql`
    INSERT INTO lunar_interpretations (category, key, title, text)
    VALUES
      ('sign', 'aries', 'Луна в Овне', 'В разработке'),
      ('sign', 'taurus', 'Луна в Тельце', 'В разработке'),
      ('sign', 'gemini', 'Луна в Близнецах', 'В разработке'),
      ('sign', 'cancer', 'Луна в Раке', 'В разработке'),
      ('sign', 'leo', 'Луна во Льве', 'В разработке'),
      ('sign', 'virgo', 'Луна в Деве', 'В разработке'),
      ('sign', 'libra', 'Луна в Весах', 'В разработке'),
      ('sign', 'scorpio', 'Луна в Скорпионе', 'В разработке'),
      ('sign', 'sagittarius', 'Луна в Стрельце', 'В разработке'),
      ('sign', 'capricorn', 'Луна в Козероге', 'В разработке'),
      ('sign', 'aquarius', 'Луна в Водолее', 'В разработке'),
      ('sign', 'pisces', 'Луна в Рыбах', 'В разработке')
    ON CONFLICT (category, key) DO NOTHING
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS forecast_text_templates (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      context TEXT NOT NULL,
      key TEXT NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT 'В разработке',
      source_note TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT forecast_text_template_context_key_unique UNIQUE (category, context, key)
    )
  `);
  await db.execute(sql`
    INSERT INTO forecast_text_templates (category, context, key, title, text, source_note)
    VALUES
      ('entity', 'transit', 'jupiter', 'Юпитер в транзитном контексте', 'расширению возможностей, росту, поиску смысла и уверенности в своих силах', 'Адаптация по книгам о транзитах, v1'),
      ('entity', 'transit', 'moon', 'Луна в транзитном контексте', 'эмоциональной реакции, внутренним переживаниям и кратким изменениям настроения', 'Адаптация по книгам о транзитах, v1'),
      ('entity', 'natal', 'pluto', 'Плутон в натальном контексте', 'глубоким внутренним реакциям, сильной вовлечённости и стремлению сохранять контроль', 'Адаптация по книгам о транзитах, v1'),
      ('entity', 'transit', 'mercury', 'Меркурий в транзитном контексте', 'Вашему мышлению, речи и способам обмена информацией', 'Адаптация по книгам о транзитах, v1'),
      ('entity', 'natal', 'chiron', 'Хирон в натальном контексте', 'чувствительности к оценке, необходимости соединить разные стороны опыта и поиску выхода из внутреннего противоречия', 'Адаптация по книгам о транзитах, v1'),
      ('aspect', 'square', 'default', 'Квадрат', 'создаёт напряжение между двумя способами реагировать и требует найти более устойчивый способ их согласовать', 'Адаптация по книгам о транзитах, v1'),
      ('aspect', 'conjunction', 'default', 'Соединение', 'усиливает совместное проявление двух факторов и делает внутреннюю реакцию заметнее', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'transit', '1', 'Транзитная планета в 1-м доме', 'личными желаниями, самовыражением и готовностью заявлять о себе', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'transit', '4', 'Транзитная планета в 4-м доме', 'домом, семьёй, родовыми связями и внутренним ощущением опоры', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'transit', '5', 'Транзитная планета в 5-м доме', 'творчеством, удовольствиями, любовью, развлечениями, детьми, спортом и конкурсами', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'transit', '9', 'Транзитная планета в 9-м доме', 'обучением, мировоззрением, дальними поездками и поиском смысла', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '1', 'Натальная планета в 1-м доме', 'личными желаниями, самовыражением и готовностью заявлять о себе', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '4', 'Натальная планета в 4-м доме', 'домом, семьёй, родовыми связями и внутренним ощущением опоры', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '5', 'Натальная планета в 5-м доме', 'творчеством, удовольствиями, любовью, развлечениями, детьми, спортом и конкурсами', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '9', 'Натальная планета в 9-м доме', 'обучением, мировоззрением, дальними поездками и поиском смысла', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '10', 'Натальная планета в 10-м доме', 'карьерой, статусом, профессиональными целями и общественной оценкой', 'Адаптация по книгам о транзитах, v1'),
      ('composition', 'square', 'default', 'Сборка напряжённого аспекта', 'Транзит усиливает внимание к {transitEntity}. Эта активность связана с {transitHouse}. Квадрат к натальному {natalPlanet} затрагивает {natalEntity}; {aspectMeaning}. В натальном доме тема связана с {natalHouse}.', 'Адаптация по книгам о транзитах, v1'),
      ('composition', 'conjunction', 'default', 'Сборка соединения Луны с Плутоном', 'Эмоциональная реакция может стать интенсивнее, а внутренние переживания — заметнее в темах, связанных с {natalHouse}. Краткий лунный транзит может подсветить сильное желание проявить себя, получить отклик или сохранить контроль над ситуацией. Постарайтесь сначала понять, что именно вызвало реакцию, и только потом действовать.', 'Адаптация по книгам о транзитах, v1')
    ON CONFLICT (category, context, key) DO UPDATE
      SET title = EXCLUDED.title, text = EXCLUDED.text, source_note = EXCLUDED.source_note, updated_at = NOW()
      WHERE forecast_text_templates.text IN (
        'Ваш мыслительный процесс, речь и способы обмена информацией',
        'чувствительность к оценке и болезненные точки самовыражения',
        'создаёт напряжение и требует найти более устойчивый способ действовать',
        'личными желаниями, самовыражением и готовностью проявляться по-своему',
        'карьеру, статус, цели и ответственность перед будущим',
        'Этот транзит делает особенно заметными {transitEntity}, связывая их с {transitHouse}. {aspectName} между этой темой и натальным {natalEntity} {aspectMeaning}; связь проявляется через {natalHouse}.'
      )
  `);
}

/** Ensures the first book-based forecast templates exist without overwriting Studio edits. */
export async function ensureForecastTemplateSeeds(): Promise<void> {
  await db.execute(sql`
    INSERT INTO forecast_text_templates (category, context, key, title, text, source_note)
    VALUES
      ('entity', 'transit', 'jupiter', 'Юпитер в транзитном контексте', 'расширению возможностей, росту, поиску смысла и уверенности в своих силах', 'Адаптация по книгам о транзитах, v1'),
      ('entity', 'transit', 'moon', 'Луна в транзитном контексте', 'эмоциональной реакции, внутренним переживаниям и кратким изменениям настроения', 'Адаптация по книгам о транзитах, v1'),
      ('entity', 'natal', 'pluto', 'Плутон в натальном контексте', 'глубоким внутренним реакциям, сильной вовлечённости и стремлению сохранять контроль', 'Адаптация по книгам о транзитах, v1'),
      ('entity', 'transit', 'mercury', 'Меркурий в транзитном контексте', 'Вашему мышлению, речи и способам обмена информацией', 'Адаптация по книгам о транзитах, v1'),
      ('entity', 'natal', 'chiron', 'Хирон в натальном контексте', 'чувствительности к оценке, необходимости соединить разные стороны опыта и поиску выхода из внутреннего противоречия', 'Адаптация по книгам о транзитах, v1'),
      ('aspect', 'square', 'default', 'Квадрат', 'создаёт напряжение между двумя способами реагировать и требует найти более устойчивый способ их согласовать', 'Адаптация по книгам о транзитах, v1'),
      ('aspect', 'conjunction', 'default', 'Соединение', 'усиливает совместное проявление двух факторов и делает внутреннюю реакцию заметнее', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'transit', '1', 'Транзитная планета в 1-м доме', 'личными желаниями, самовыражением и готовностью заявлять о себе', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'transit', '4', 'Транзитная планета в 4-м доме', 'домом, семьёй, родовыми связями и внутренним ощущением опоры', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'transit', '5', 'Транзитная планета в 5-м доме', 'творчеством, удовольствиями, любовью, развлечениями, детьми, спортом и конкурсами', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'transit', '9', 'Транзитная планета в 9-м доме', 'обучением, мировоззрением, дальними поездками и поиском смысла', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '1', 'Натальная планета в 1-м доме', 'личными желаниями, самовыражением и готовностью заявлять о себе', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '4', 'Натальная планета в 4-м доме', 'домом, семьёй, родовыми связями и внутренним ощущением опоры', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '5', 'Натальная планета в 5-м доме', 'творчеством, удовольствиями, любовью, развлечениями, детьми, спортом и конкурсами', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '9', 'Натальная планета в 9-м доме', 'обучением, мировоззрением, дальними поездками и поиском смысла', 'Адаптация по книгам о транзитах, v1'),
      ('house', 'natal', '10', 'Натальная планета в 10-м доме', 'карьерой, статусом, профессиональными целями и общественной оценкой', 'Адаптация по книгам о транзитах, v1'),
      ('composition', 'square', 'default', 'Сборка напряжённого аспекта', 'Транзит усиливает внимание к {transitEntity}. Эта активность связана с {transitHouse}. Квадрат к натальному {natalPlanet} затрагивает {natalEntity}; {aspectMeaning}. В натальном доме тема связана с {natalHouse}.', 'Адаптация по книгам о транзитах, v1'),
      ('composition', 'conjunction', 'default', 'Сборка соединения Луны с Плутоном', 'Эмоциональная реакция может стать интенсивнее, а внутренние переживания — заметнее в темах, связанных с {natalHouse}. Краткий лунный транзит может подсветить сильное желание проявить себя, получить отклик или сохранить контроль над ситуацией. Постарайтесь сначала понять, что именно вызвало реакцию, и только потом действовать.', 'Адаптация по книгам о транзитах, v1')
    ON CONFLICT (category, context, key) DO UPDATE
      SET title = EXCLUDED.title, text = EXCLUDED.text, source_note = EXCLUDED.source_note, updated_at = NOW()
      WHERE forecast_text_templates.text IN (
        'Ваш мыслительный процесс, речь и способы обмена информацией',
        'чувствительность к оценке и болезненные точки самовыражения',
        'создаёт напряжение и требует найти более устойчивый способ действовать',
        'личными желаниями, самовыражением и готовностью проявляться по-своему',
        'карьеру, статус, цели и ответственность перед будущим',
        'Этот транзит делает особенно заметными {transitEntity}, связывая их с {transitHouse}. {aspectName} между этой темой и натальным {natalEntity} {aspectMeaning}; связь проявляется через {natalHouse}.'
      )
  `);
}
