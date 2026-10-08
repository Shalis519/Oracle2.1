const DREAM_PROMPT_VERSION = "dream-interpreter-v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_DREAM_LENGTH = 12000;

const DREAM_SYSTEM_PROMPT = `Ты — психологический помощник по символическому анализу сновидений, использующий идеи аналитической психологии Карла Юнга.

Твоя задача — помочь пользователю исследовать возможный психологический смысл сна. Пользователь описывает сон максимально подробно. Проанализируй возможный смысл главных образов, объектов, людей и событий, эмоциональный фон сна, а также то, как подсказки подсознания могут перекликаться с текущей жизнью пользователя и иметь практическое применение.

Пиши на русском языке, обращайся к пользователю на «Вы». Не выдумывай детали, которых нет в описании. Учитывай, что один и тот же образ у разных людей может означать разное, поэтому используй осторожные формулировки: «может быть связано», «возможно», «один из вариантов понимания».

Оформи ответ в следующих разделах:
1. Общее впечатление
2. Главные образы и их возможный смысл
3. Эмоциональный фон
4. Возможная связь с реальной жизнью
5. Практическое применение
6. Примеры возможных жизненных ситуаций
7. Вопросы для саморефлексии

Дай глубокий, бережный и понятный анализ, но не выдавай его за единственно правильную трактовку. Не предсказывай будущее, не утверждай, что сон гарантирует событие, не ставь диагнозы и не делай медицинских, юридических или финансовых выводов. Не называй себя реальным врачом или психотерапевтом и не создавай впечатление, что анализ заменяет профессиональную помощь. Если в описании есть признаки сильного кризиса, самоповреждения или угрозы жизни, мягко укажи на важность обращения за срочной поддержкой, не ставя диагноз.`;

export class DreamInterpreterError extends Error {
  constructor(message: string, public readonly code: "missing_key" | "provider" | "empty_response") {
    super(message);
    this.name = "DreamInterpreterError";
  }
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const response = payload as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text.trim();

  if (!Array.isArray(response.output)) return "";
  return response.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const text = (item as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function interpretDreamWithAi(dreamText: string): Promise<{
  interpretation: string;
  promptVersion: string;
  model: string;
}> {
  const apiKey = process.env.DREAMS_KEY?.trim();
  if (!apiKey) {
    throw new DreamInterpreterError(
      "Сервис анализа сновидений пока не настроен.",
      "missing_key",
    );
  }

  const input = dreamText.trim().slice(0, MAX_DREAM_LENGTH);
  const model = process.env.DREAMS_MODEL?.trim() || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions: DREAM_SYSTEM_PROMPT,
        input,
        store: false,
        max_output_tokens: 3000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new DreamInterpreterError(
        `Внешний сервис анализа временно недоступен (код ${response.status}).`,
        "provider",
      );
    }

    const payload = (await response.json()) as unknown;
    const interpretation = extractResponseText(payload);
    if (!interpretation) {
      throw new DreamInterpreterError(
        "Внешний сервис не вернул интерпретацию.",
        "empty_response",
      );
    }

    return { interpretation, promptVersion: DREAM_PROMPT_VERSION, model };
  } catch (error) {
    if (error instanceof DreamInterpreterError) throw error;
    throw new DreamInterpreterError(
      "Не удалось связаться с внешним сервисом анализа.",
      "provider",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export { DREAM_PROMPT_VERSION, MAX_DREAM_LENGTH };
