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
    ON CONFLICT (category, key) DO NOTHING
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
      ('entity', 'transit', 'mercury', 'Меркурий в транзитном контексте', 'Ваш мыслительный процесс, речь и способы обмена информацией', 'Начальный литературный шаблон'),
      ('entity', 'natal', 'chiron', 'Хирон в натальном контексте', 'чувствительность к оценке и болезненные точки самовыражения', 'Начальный литературный шаблон'),
      ('aspect', 'square', 'default', 'Квадрат', 'создаёт напряжение и требует найти более устойчивый способ действовать', 'Начальный литературный шаблон'),
      ('house', 'transit', '1', 'Транзитная планета в 1-м доме', 'личными желаниями, самовыражением и готовностью проявляться по-своему', 'Начальный литературный шаблон'),
      ('house', 'natal', '10', 'Натальная планета в 10-м доме', 'карьеру, статус, цели и ответственность перед будущим', 'Начальный литературный шаблон'),
      ('composition', 'square', 'default', 'Сборка напряжённого аспекта', 'Этот транзит делает особенно заметными {transitEntity}, связывая их с {transitHouse}. {aspectName} между этой темой и натальным {natalEntity} {aspectMeaning}; связь проявляется через {natalHouse}.', 'Начальный литературный шаблон')
    ON CONFLICT (category, context, key) DO NOTHING
  `);
}
