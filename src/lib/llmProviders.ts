/**
 * Promptly Multi-Provider LLM Client
 * -----------------------------------
 * Supports:
 *   1. Supabase Edge Function (`promptly-analyze`, `promptly-refine`)
 *   2. OpenAI-compatible API (OpenAI GPT-4o-mini, Groq, Ollama, DeepSeek)
 *   3. Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
 *   4. Anthropic Claude API (claude-3-5-haiku)
 *
 * Uses strict structured output formatting with zero markdown code wraps.
 */

import { supabase } from './supabase';
import { extractJson, stripFence } from './aiRules';
import type { LlmProvider, UserAnswer } from './types';

export interface ProviderConfig {
  provider: LlmProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 6000;

export const PROMPTLY_ANALYSIS_JSON_SCHEMA = {
  name: 'promptly_prompt_analysis',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      dimensions: {
        type: 'object',
        properties: {
          goal: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          target_user: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          task: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          expected_output: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          constraints: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          context: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          technical: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          input: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          ambiguity: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
          examples: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['good', 'needs_attention', 'missing'] },
              tip: { type: 'string' },
            },
            required: ['status', 'tip'],
            additionalProperties: false,
          },
        },
        required: [
          'goal',
          'target_user',
          'task',
          'expected_output',
          'constraints',
          'context',
          'technical',
          'input',
          'ambiguity',
          'examples',
        ],
        additionalProperties: false,
      },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            dimension: {
              type: 'string',
              enum: [
                'goal',
                'target_user',
                'task',
                'expected_output',
                'constraints',
                'context',
                'technical',
                'input',
                'ambiguity',
                'examples',
              ],
            },
            question: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['label', 'value'],
                additionalProperties: false,
              },
            },
            allow_custom: { type: 'boolean' },
          },
          required: ['id', 'dimension', 'question', 'options', 'allow_custom'],
          additionalProperties: false,
        },
      },
      instant_improved_prompt: { type: 'string' },
    },
    required: ['dimensions', 'questions', 'instant_improved_prompt'],
    additionalProperties: false,
  },
};

const SYSTEM_ANALYSIS_PROMPT = `You are Promptly, an expert AI Prompt Optimizer ("Grammarly for Prompts").
Analyze the user's raw prompt across all 10 essential dimensions:
1. goal: Action verb & core objective.
2. target_user: Audience/end-user.
3. task: Specific operation (build, explain, summarize, review).
4. expected_output: Exact output structure/format.
5. constraints: Limits, style, negative constraints.
6. context: Situation, purpose, background.
7. technical: Tech stack, language, framework.
8. input: Reference material or source data.
9. ambiguity: Vague words to eliminate.
10. examples: Sample output format.

Rules:
- For each dimension, assign status: 'good' | 'needs_attention' | 'missing' with a 1-sentence tip.
- Identify top 1 to 3 highest-leverage missing dimensions and formulate a clarifying question for each.
- Each question must include 3 to 4 quick-select pill options + allow_custom: true.
- If the prompt is already clear and high quality, provide an empty questions array [].
- Generate instant_improved_prompt using smart production defaults with a clear role, task, output format, requirements, and the closing instruction: "If anything important is unclear, ask me one focused question before answering."
- Output valid JSON strictly adhering to the schema. Do NOT wrap in markdown fences.`;

export function getActiveProviderConfig(): ProviderConfig | null {
  const env =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env
      : ((typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>);

  if (env.VITE_OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: env.VITE_OPENAI_API_KEY,
      baseUrl: env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    };
  }

  if (env.VITE_GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      apiKey: env.VITE_GEMINI_API_KEY,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: env.VITE_GEMINI_MODEL || 'gemini-1.5-flash',
    };
  }

  if (env.VITE_ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: env.VITE_ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com/v1',
      model: env.VITE_ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    };
  }

  return null;
}

/** Call Supabase Edge Function if available */
export async function callSupabaseEdgeFunction(
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });
    clearTimeout(timeoutId);
    if (error) throw error;
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/** Call OpenAI or OpenAI-compatible endpoint with JSON Schema strict output */
export async function callOpenAI(
  prompt: string,
  config: ProviderConfig
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: SYSTEM_ANALYSIS_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: PROMPTLY_ANALYSIS_JSON_SCHEMA,
        },
        temperature: 0.2,
      }),
    });

    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const rawContent = json?.choices?.[0]?.message?.content;
    return extractJson(rawContent);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/** Call Google Gemini with JSON schema mime-type */
export async function callGemini(
  prompt: string,
  config: ProviderConfig
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const endpoint = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_ANALYSIS_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: PROMPTLY_ANALYSIS_JSON_SCHEMA.schema,
          temperature: 0.2,
        },
      }),
    });

    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return extractJson(rawContent);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/** Call Anthropic Messages API */
export async function callAnthropic(
  prompt: string,
  config: ProviderConfig
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        max_tokens: 2048,
        system: `${SYSTEM_ANALYSIS_PROMPT}\nIMPORTANT: Respond with pure, valid JSON matching the schema only. No markdown formatting.`,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const textPart = data?.content?.find((c: { type: string; text?: string }) => c.type === 'text');
    return extractJson(textPart?.text || '');
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/** Call LLM for refinement with user answers */
export async function callLlmRefinement(
  originalPrompt: string,
  answers: UserAnswer[],
  config: ProviderConfig
): Promise<{ improved_prompt: string; changes: string[] }> {
  const formattedAnswers = answers
    .map((a) => `- Dimension [${a.dimension}]: ${a.value}`)
    .join('\n');

  const userMessage = `Original prompt:
"""${originalPrompt}"""

User clarified answers:
${formattedAnswers}

Task: Synthesize a refined, highly effective prompt incorporating these answers into a structured format. Return JSON:
{
  "improved_prompt": "...",
  "changes": ["Change 1", "Change 2"]
}`;

  if (config.provider === 'openai') {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are Promptly. Output only valid JSON with "improved_prompt" and "changes" string array. No markdown code blocks.',
          },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const json = await res.json();
    const parsed = extractJson(json?.choices?.[0]?.message?.content) as {
      improved_prompt?: string;
      changes?: string[];
    };
    return {
      improved_prompt: stripFence(parsed.improved_prompt || originalPrompt),
      changes: Array.isArray(parsed.changes) ? parsed.changes : ['Refined prompt with provided details.'],
    };
  }

  // Fallback if not OpenAI
  throw new Error('Refinement unsupported directly on this provider; using heuristic fallback.');
}
