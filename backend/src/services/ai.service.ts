import { env } from '../config/env';
import { AppError, AIGeneratedPlan, AIFeedbackResult } from '../types/index';
import { buildPlannerPrompt } from '../prompts/planner';
import { buildCoachPrompt, CoachContext } from '../prompts/coach';
import { buildStructurerPrompt } from '../prompts/structurer';
import { PlanParams } from '../types/index';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT = 180000; // 180 seconds (free models can be slow)

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCandidateModels(): string[] {
  const fallbacks = env.OPENROUTER_FALLBACK_MODELS
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return [env.OPENROUTER_MODEL, ...fallbacks].filter(
    (model, index, models) => models.indexOf(model) === index,
  );
}

function isRetriableModelError(err: unknown): boolean {
  return (
    err instanceof AppError &&
    err.code === 'AI_SERVICE_UNAVAILABLE' &&
    (err.statusCode === 429 || err.statusCode === 503)
  );
}

function getBackoffDelayMs(attempt: number): number {
  const baseDelayMs = 1000 * (attempt + 1);
  const jitterMs = Math.floor(Math.random() * 700);
  return baseDelayMs + jitterMs;
}

function buildOpenRouterPayload(
  model: string,
  messages: OpenRouterMessage[],
  temperature: number,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    plugins: [{ id: 'response-healing' }],
  };

  // Some free models, such as gpt-oss on OpenRouter, reject reasoning: none.
  if (!model.includes('gpt-oss')) {
    payload.reasoning = { effort: 'none' };
  }

  return payload;
}

async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  temperature = 0.7,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://leadme.app',
        'X-Title': 'LeadMe',
      },
      body: JSON.stringify(buildOpenRouterPayload(model, messages, temperature)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new AppError(
        response.status,
        'AI_SERVICE_UNAVAILABLE',
        `OpenRouter API returned ${response.status} for ${model}: ${errorText}`,
      );
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new AppError(
        502,
        'AI_SERVICE_ERROR',
        'Empty response from AI service',
      );
    }

    return content;
  } catch (err) {
    if (err instanceof AppError) throw err;

    if (err instanceof Error && err.name === 'AbortError') {
      throw new AppError(
        503,
        'AI_SERVICE_UNAVAILABLE',
        'AI service request timed out',
      );
    }

    throw new AppError(
      503,
      'AI_SERVICE_UNAVAILABLE',
      `Failed to connect to AI service: ${(err as Error).message}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseJSON<T>(content: string): T {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = jsonMatch ? jsonMatch[1].trim() : content.trim();
    return JSON.parse(raw) as T;
  } catch {
    throw new AppError(
      502,
      'AI_SERVICE_ERROR',
      'Failed to parse AI response as JSON',
    );
  }
}

export async function generatePlan(
  params: PlanParams,
  mode: 'basic' | 'detailed',
): Promise<AIGeneratedPlan> {
  const systemPrompt =
    mode === 'basic'
      ? buildPlannerPrompt(params)
      : buildStructurerPrompt(params);

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content:
        mode === 'basic'
          ? '위 정보를 기반으로 학습 계획을 JSON 형식으로 생성해주세요.'
          : '위 정보를 기반으로 구조 기반 정밀 학습 계획을 JSON 형식으로 생성해주세요.',
    },
  ];

  const temperature = mode === 'basic' ? 0.7 : 0.3;
  let lastError: Error | null = null;
  let retriableFailureCount = 0;

  for (const model of getCandidateModels()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const content = await callOpenRouter(model, messages, temperature);
        const plan = parseJSON<AIGeneratedPlan>(content);
        if (!plan.macroGoals || !Array.isArray(plan.macroGoals) || plan.macroGoals.length === 0) {
          throw new AppError(502, 'AI_SERVICE_ERROR', 'Invalid plan structure from AI');
        }
        return plan;
      } catch (err) {
        lastError = err as Error;

        // Retry parse failures once on the same model.
        if (attempt === 0 && err instanceof AppError && err.code === 'AI_SERVICE_ERROR') {
          continue;
        }

        // Fall through to the next model for provider congestion or shared free-tier limits.
        if (isRetriableModelError(err)) {
          retriableFailureCount += 1;
          await sleep(getBackoffDelayMs(attempt));
          break;
        }

        throw err;
      }
    }
  }

  if (retriableFailureCount > 0) {
    throw new AppError(
      503,
      'AI_SERVICE_UNAVAILABLE',
      '무료 AI 모델이 현재 혼잡합니다. 잠시 후 다시 시도해주세요.',
    );
  }

  throw lastError!;
}

export async function generateFeedback(
  context: CoachContext,
): Promise<AIFeedbackResult> {
  const systemPrompt = buildCoachPrompt(context);

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: '위 학습 데이터를 분석하여 피드백 리포트를 JSON 형식으로 생성해주세요.',
    },
  ];

  let lastError: Error | null = null;
  let retriableFailureCount = 0;

  for (const model of getCandidateModels()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const content = await callOpenRouter(model, messages, 0.8);
        const feedback = parseJSON<AIFeedbackResult>(content);
        if (!feedback.summary) {
          throw new AppError(502, 'AI_SERVICE_ERROR', 'Invalid feedback structure from AI');
        }
        return feedback;
      } catch (err) {
        lastError = err as Error;

        if (attempt === 0 && err instanceof AppError && err.code === 'AI_SERVICE_ERROR') {
          continue;
        }

        if (isRetriableModelError(err)) {
          retriableFailureCount += 1;
          await sleep(getBackoffDelayMs(attempt));
          break;
        }

        throw err;
      }
    }
  }

  if (retriableFailureCount > 0) {
    throw new AppError(
      503,
      'AI_SERVICE_UNAVAILABLE',
      '무료 AI 모델이 현재 혼잡합니다. 잠시 후 다시 시도해주세요.',
    );
  }

  throw lastError!;
}
