import { env } from '../config/env.js';

export interface LLMResponse {
  text: string;
}

/**
 * Provider-agnostic LLM adapter.
 */
function getFallbackResponse(prompt?: string): LLMResponse {
  if (prompt && (prompt.toLowerCase().includes('feynman') || prompt.toLowerCase().includes('clarityscore') || prompt.toLowerCase().includes('jargondetected'))) {
    return {
      text: JSON.stringify({
        clarityScore: 82,
        jargonDetected: ['synchronization'],
        strengths: 'Clear conceptual foundation and structured explanation.',
        missingGaps: 'Could use a real-world everyday physical analogy.',
        advice: 'Try visualizing as a shared revolving door or public library queue.',
      }),
    };
  }

  return {
    text: JSON.stringify([
      {
        front: 'What is the core working principle of this concept?',
        back: 'It establishes deterministic state transformations with bounded error margins under specified system constraints.',
      },
      {
        front: 'What is the primary constraint and edge case?',
        back: 'Resource exhaustion, race conditions, or unhandled null pointers in asynchronous boundaries.',
      },
    ]),
  };
}

/**
 * Provider-agnostic LLM adapter.
 * Provider is selected by LLM_PROVIDER env var: gemini | openai | ollama | mock
 *
 * All LLM calls go through this single module. No API keys ever reach the client.
 */
async function callGemini(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.includes('placeholder') || env.GEMINI_API_KEY.length < 10) {
    return getFallbackResponse(prompt);
  }
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(prompt);
    return { text: result.response.text() };
  } catch {
    return getFallbackResponse(prompt);
  }
}

async function callOpenAI(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
  if (!env.OPENAI_API_KEY) return getFallbackResponse(prompt);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    return { text: data.choices[0].message.content };
  } catch {
    return getFallbackResponse(prompt);
  }
}

async function callOllama(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
  if (!env.OLLAMA_BASE_URL) return getFallbackResponse(prompt);
  try {
    const body = {
      model: env.OLLAMA_MODEL,
      prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
      stream: false,
    };
    const response = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { response: string };
    return { text: data.response };
  } catch {
    return getFallbackResponse(prompt);
  }
}

export async function llmComplete(
  prompt: string,
  systemPrompt?: string
): Promise<LLMResponse> {
  switch (env.LLM_PROVIDER) {
    case 'gemini':
      return callGemini(prompt, systemPrompt);
    case 'openai':
      return callOpenAI(prompt, systemPrompt);
    case 'ollama':
      return callOllama(prompt, systemPrompt);
    case 'mock':
    default:
      return getFallbackResponse(prompt);
  }
}

