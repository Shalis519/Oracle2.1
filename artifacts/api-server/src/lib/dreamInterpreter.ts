const DREAM_PROMPT_VERSION = "dream-interpreter-v1";
const GOOGLE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODEL = "gemini-2.5-flash";
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
  constructor(
    message: string,
    public readonly code:
      | "missing_key"
      | "provider"
      | "quota"
      | "rate_limit"
      | "empty_response",
  ) {
    super(message);
    this.name = "DreamInterpreterError";
  }
}

async function getProviderError(response: Response): Promise<{
  message: string;
  code: "provider" | "quota" | "rate_limit";
}> {
  const raw = await response.text();
  let providerMessage = "";
  let providerCode = "";
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: unknown; code?: unknown; type?: unknown };
    };
    providerMessage = typeof parsed.error?.message === "string" ? parsed.error.message : "";
    providerCode = typeof parsed.error?.code === "string" ? parsed.error.code : "";
    if (!providerCode && typeof parsed.error?.type === "string") {
      providerCode = parsed.error.type;
    }
  } catch {
    // Шлюз вернул текст.
  }

  const lower = `${providerCode} ${providerMessage}`.toLowerCase();
  if (
    response.status === 429 &&
    (lower.includes("quota") || lower.includes("billing") || lower.includes("credit"))
  ) {
    return {
      code: "quota",
      message:
        "У Google API ключа закончилась квота. Проверьте настройки в Google AI Studio.",
    };
  }

  if (response.status === 429) {
    return {
      code: "rate_limit",
      message:
        "Google временно ограничил частоту запросов. Подождите немного.",
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      code: "provider",
      message:
        "Ключ Google API недействителен. Проверьте правильность ключа на Render.",
    };
  }

  return {
    code: "provider",
    message: `Сервис Google AI временно недоступен (код ${response.status}).`,
  };
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const response = payload as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const text = (part as { text?: unknown }).text;
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
  // Ищем ключ Google (можно использовать GOOGLE_API_KEY или старый OPENROUTER_API_KEY)
  const apiKey = (process.env.GOOGLE_API_KEY || process.env.OPENROUTER_API_KEY || process.env.DREAMS_KEY)?.trim();
  if (!apiKey) {
    throw new DreamInterpreterError(
      "Сервис анализа сновидений пока не настроен (отсутствует ключ API).",
      "missing_key",
    );
  }

  const input = dreamText.trim().slice(0, MAX_DREAM_LENGTH);
  const model = process.env.DREAMS_MODEL?.trim() || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(GOOGLE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: DREAM_SYSTEM_PROMPT },
          { role: "user", content: input },
        ],
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const providerError = await getProviderError(response);
      throw new DreamInterpreterError(providerError.message, providerError.code);
    }

    const payload = (await response.json()) as unknown;
    const interpretation = extractResponseText(payload);
    if (!interpretation) {
      throw new DreamInterpreterError(
        "Google API не вернул интерпретацию.",
        "empty_response",
      );
    }

    return { interpretation, promptVersion: DREAM_PROMPT_VERSION, model };
  } catch (error) {
    if (error instanceof DreamInterpreterError) throw error;
    throw new DreamInterpreterError(
      "Не удалось связаться с Google AI.",
      "provider",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export { DREAM_PROMPT_VERSION, MAX_DREAM_LENGTH };
