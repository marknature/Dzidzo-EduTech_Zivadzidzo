const OpenAI = require('openai');
const {
  LLM_PROVIDERS,
  configuredLlmProvider,
  predictionModelFor,
  chatModelFor,
  OPENAI_PRICING_PER_MILLION_TOKENS,
} = require('../config');

// This module is the only place a decision-support request chooses an external
// LLM API. Provider selection is server-side through LLM_PROVIDER and never comes
// from a request body, user profile, or mobile client. There is intentionally no
// automatic failover: switching provider can change data routing, behaviour, and
// cost, so an operator must make that choice explicitly in backend configuration.

const API_KEY_ENV_BY_PROVIDER = Object.freeze({
  [LLM_PROVIDERS.OPENAI]: 'OPENAI_API_KEY',
  [LLM_PROVIDERS.GEMINI]: 'GEMINI_API_KEY',
  [LLM_PROVIDERS.ANTHROPIC]: 'ANTHROPIC_API_KEY',
});

const PROVIDER_LABELS = Object.freeze({
  [LLM_PROVIDERS.OPENAI]: 'OpenAI',
  [LLM_PROVIDERS.GEMINI]: 'Gemini',
  [LLM_PROVIDERS.ANTHROPIC]: 'Anthropic',
});

let cachedOpenaiClient = null;
let cachedOpenaiApiKey = null;

function providerError(code, message, provider) {
  const error = new Error(message);
  error.code = code;
  error.provider = provider;
  return error;
}

function providerApiKey(provider) {
  const envName = API_KEY_ENV_BY_PROVIDER[provider];
  if (!envName) {
    throw providerError('LLM_PROVIDER_UNSUPPORTED', `Unsupported LLM provider "${provider}".`, provider);
  }
  const value = process.env[envName];
  if (!value || !String(value).trim()) {
    throw providerError(
      'LLM_PROVIDER_NOT_CONFIGURED',
      `${PROVIDER_LABELS[provider]} is selected but ${envName} is not configured on the backend.`,
      provider,
    );
  }
  return String(value).trim();
}

function openaiClient(apiKey) {
  if (cachedOpenaiApiKey !== apiKey) {
    cachedOpenaiClient = new OpenAI({ apiKey });
    cachedOpenaiApiKey = apiKey;
  }
  return cachedOpenaiClient;
}

// Minimal recursive validator matching the JSON-schema shapes used by our own
// predict-head schemas (type/required/properties/items/enum/minimum/maximum).
// Native structured output is helpful but never a substitute for application-side
// validation before anything reaches Supabase or the UI.
function validate(schema, data, path = '$') {
  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error(`Schema validation failed at ${path}: expected object`);
    }
    for (const key of schema.required || []) {
      if (!(key in data)) throw new Error(`Schema validation failed at ${path}: missing required field "${key}"`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!(key in (schema.properties || {}))) throw new Error(`Schema validation failed at ${path}: unexpected field "${key}"`);
      }
    }
    for (const [key, propSchema] of Object.entries(schema.properties || {})) {
      if (key in data) validate(propSchema, data[key], `${path}.${key}`);
    }
    return;
  }
  if (schema.type === 'array') {
    if (!Array.isArray(data)) throw new Error(`Schema validation failed at ${path}: expected array`);
    if (typeof schema.minItems === 'number' && data.length < schema.minItems) {
      throw new Error(`Schema validation failed at ${path}: expected at least ${schema.minItems} items`);
    }
    if (typeof schema.maxItems === 'number' && data.length > schema.maxItems) {
      throw new Error(`Schema validation failed at ${path}: expected at most ${schema.maxItems} items`);
    }
    if (schema.items) data.forEach((item, index) => validate(schema.items, item, `${path}[${index}]`));
    return;
  }
  if (schema.type === 'string') {
    if (typeof data !== 'string') throw new Error(`Schema validation failed at ${path}: expected string`);
    if (schema.enum && !schema.enum.includes(data)) {
      throw new Error(`Schema validation failed at ${path}: "${data}" not in [${schema.enum.join(', ')}]`);
    }
    return;
  }
  if (schema.type === 'number') {
    if (typeof data !== 'number' || Number.isNaN(data)) throw new Error(`Schema validation failed at ${path}: expected number`);
    if (typeof schema.minimum === 'number' && data < schema.minimum) throw new Error(`Schema validation failed at ${path}: ${data} < minimum ${schema.minimum}`);
    if (typeof schema.maximum === 'number' && data > schema.maximum) throw new Error(`Schema validation failed at ${path}: ${data} > maximum ${schema.maximum}`);
  }
}

function parseStructuredJson(text, provider) {
  if (typeof text !== 'string' || !text.trim()) {
    throw providerError('LLM_PROVIDER_INVALID_JSON', `${PROVIDER_LABELS[provider]} returned an empty structured response.`, provider);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw providerError('LLM_PROVIDER_INVALID_JSON', `${PROVIDER_LABELS[provider]} returned a response that could not be parsed as JSON.`, provider);
  }
}

// Anthropic's TypeScript/Python SDKs transform unsupported JSON-schema constraints
// before sending them and then validate against the original schema afterwards. This
// REST adapter makes the same distinction: retain the shape provider-side, describe
// numeric/cardinality constraints in prose, and enforce the complete original schema
// locally in validate()/Zod below.
function anthropicOutputSchema(value) {
  if (Array.isArray(value)) return value.map(anthropicOutputSchema);
  if (!value || typeof value !== 'object') return value;

  const constraints = [];
  const copy = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'minimum') { constraints.push(`minimum ${nested}`); continue; }
    if (key === 'maximum') { constraints.push(`maximum ${nested}`); continue; }
    if (key === 'minItems') { constraints.push(`at least ${nested} item${nested === 1 ? '' : 's'}`); continue; }
    if (key === 'maxItems') { constraints.push(`at most ${nested} item${nested === 1 ? '' : 's'}`); continue; }
    if (key === 'minLength') { constraints.push(`at least ${nested} characters`); continue; }
    if (key === 'maxLength') { constraints.push(`at most ${nested} characters`); continue; }
    copy[key] = anthropicOutputSchema(nested);
  }

  if (copy.type === 'object' && copy.additionalProperties === undefined) copy.additionalProperties = false;
  if (constraints.length) {
    const existing = typeof copy.description === 'string' && copy.description.trim() ? `${copy.description.trim()} ` : '';
    copy.description = `${existing}Application validation requires ${constraints.join(', ')}.`;
  }
  return copy;
}

function estimateCostUsd(model, usage) {
  const rates = OPENAI_PRICING_PER_MILLION_TOKENS[model];
  if (!rates || !usage) return 0;
  const inputCost = ((usage.prompt_tokens || 0) / 1_000_000) * rates.input;
  const outputCost = ((usage.completion_tokens || 0) / 1_000_000) * rates.output;
  return Number((inputCost + outputCost).toFixed(6));
}

function structuredResponse({ result, provider, model, usage }) {
  const isOpenAi = provider === LLM_PROVIDERS.OPENAI;
  return {
    result,
    providerUsed: provider,
    modelUsed: model,
    usage,
    // Prices for optional providers are deliberately not guessed. The existing
    // cost entry is written only when a known OpenAI rate is configured.
    costUsd: isOpenAi ? estimateCostUsd(model, usage) : null,
    costEstimateAvailable: isOpenAi && Boolean(OPENAI_PRICING_PER_MILLION_TOKENS[model]),
  };
}

async function postJson({ url, headers, body, provider }) {
  if (typeof fetch !== 'function') {
    throw providerError('LLM_PROVIDER_REQUEST_FAILED', 'This Node runtime does not provide fetch for the selected LLM provider.', provider);
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw providerError('LLM_PROVIDER_REQUEST_FAILED', `${PROVIDER_LABELS[provider]} could not be reached.`, provider);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw providerError('LLM_PROVIDER_REQUEST_FAILED', `${PROVIDER_LABELS[provider]} returned an unreadable API response.`, provider);
  }

  if (!response.ok) {
    throw providerError('LLM_PROVIDER_REQUEST_FAILED', `${PROVIDER_LABELS[provider]} rejected the request. Check the backend provider configuration and account.`, provider);
  }
  return payload;
}

async function runOpenAiStructuredPrediction({ schema, systemPrompt, userContent, model }) {
  const provider = LLM_PROVIDERS.OPENAI;
  const openai = openaiClient(providerApiKey(provider));
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: schema },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });
  } catch {
    throw providerError('LLM_PROVIDER_REQUEST_FAILED', 'OpenAI rejected the structured prediction request. Check the backend provider configuration and account.', provider);
  }

  return {
    provider,
    model,
    text: completion?.choices?.[0]?.message?.content,
    usage: completion?.usage,
  };
}

async function runGeminiStructuredPrediction({ schema, systemPrompt, userContent, model }) {
  const provider = LLM_PROVIDERS.GEMINI;
  const apiKey = providerApiKey(provider);
  const payload = await postJson({
    provider,
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseJsonSchema: schema.schema,
      },
    },
  });

  const parts = payload?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.filter((part) => typeof part?.text === 'string').map((part) => part.text).join('')
    : '';
  return {
    provider,
    model,
    text,
    usage: {
      prompt_tokens: payload?.usageMetadata?.promptTokenCount || 0,
      completion_tokens: payload?.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: payload?.usageMetadata?.totalTokenCount || 0,
    },
  };
}

async function runAnthropicStructuredPrediction({ schema, systemPrompt, userContent, model }) {
  const provider = LLM_PROVIDERS.ANTHROPIC;
  const apiKey = providerApiKey(provider);
  const payload = await postJson({
    provider,
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: {
      model,
      max_tokens: 2048,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: anthropicOutputSchema(schema.schema),
        },
      },
    },
  });

  if (payload?.stop_reason === 'refusal' || payload?.stop_reason === 'max_tokens') {
    throw providerError('LLM_PROVIDER_INVALID_JSON', 'Anthropic did not complete a valid structured prediction response.', provider);
  }
  const text = Array.isArray(payload?.content)
    ? payload.content.filter((part) => part?.type === 'text' && typeof part.text === 'string').map((part) => part.text).join('')
    : '';
  return {
    provider,
    model,
    text,
    usage: {
      prompt_tokens: payload?.usage?.input_tokens || 0,
      completion_tokens: payload?.usage?.output_tokens || 0,
      total_tokens: (payload?.usage?.input_tokens || 0) + (payload?.usage?.output_tokens || 0),
    },
  };
}

// Runs every schema-constrained prediction head (and the legacy compatibility audit)
// through the selected provider while preserving one strict output contract.
async function runStructuredPrediction({ schema, zodSchema, systemPrompt, userContent, model }) {
  const provider = configuredLlmProvider();
  const selectedModel = model || predictionModelFor(provider);
  let response;

  if (provider === LLM_PROVIDERS.OPENAI) {
    response = await runOpenAiStructuredPrediction({ schema, systemPrompt, userContent, model: selectedModel });
  } else if (provider === LLM_PROVIDERS.GEMINI) {
    response = await runGeminiStructuredPrediction({ schema, systemPrompt, userContent, model: selectedModel });
  } else if (provider === LLM_PROVIDERS.ANTHROPIC) {
    response = await runAnthropicStructuredPrediction({ schema, systemPrompt, userContent, model: selectedModel });
  } else {
    throw providerError('LLM_PROVIDER_UNSUPPORTED', `Unsupported LLM provider "${provider}".`, provider);
  }

  const parsed = parseStructuredJson(response.text, provider);
  validate(schema.schema, parsed);
  if (zodSchema) zodSchema.parse(parsed);
  return structuredResponse({ result: parsed, provider, model: selectedModel, usage: response.usage });
}

// ZivaDzidzo chat persists OpenAI-compatible tool-call records and presently relies on
// OpenAI's Chat Completions tool protocol. Do not silently degrade or re-route a chat
// conversation when Gemini/Anthropic is selected for structured assessments.
async function runChatCompletion({ messages, tools, model, toolChoice = 'auto' }) {
  const provider = configuredLlmProvider();
  if (provider !== LLM_PROVIDERS.OPENAI) {
    throw providerError(
      'LLM_PROVIDER_CAPABILITY_UNSUPPORTED',
      `Tool-enabled ZivaDzidzo chat currently requires LLM_PROVIDER=openai; ${PROVIDER_LABELS[provider]} remains available for the structured assessment heads.`,
      provider,
    );
  }

  const selectedModel = model || chatModelFor(provider);
  const openai = openaiClient(providerApiKey(provider));
  try {
    return await openai.chat.completions.create({
      model: selectedModel,
      messages,
      ...(tools ? { tools, tool_choice: toolChoice } : {}),
    });
  } catch {
    throw providerError('LLM_PROVIDER_REQUEST_FAILED', 'OpenAI rejected the chat request. Check the backend provider configuration and account.', provider);
  }
}

module.exports = {
  runStructuredPrediction,
  runChatCompletion,
  estimateCostUsd,
  validate,
  providerApiKey,
  anthropicOutputSchema,
};
