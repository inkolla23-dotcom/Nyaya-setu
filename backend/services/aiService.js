import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

dotenv.config();

// ─── Singleton Clients ─────────────────────────────────────────────────────────
let _geminiClient  = null;
let _openaiClient  = null;
let _groqClient    = null;

function getGeminiClient() {
  if (!_geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'mock_key' || !key.trim()) {
      return null; // Not configured — skip to next provider
    }
    _geminiClient = new GoogleGenerativeAI(key);
    console.log('[PROVIDER] Gemini client initialized.');
  }
  return _geminiClient;
}

function getOpenAiClient() {
  if (!_openaiClient) {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key === 'mock_key' || !key.trim()) {
      return null; // Not configured — skip to next provider
    }
    _openaiClient = new OpenAI({
      apiKey: key,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });
    console.log('[PROVIDER] OpenAI client initialized.');
  }
  return _openaiClient;
}

function getGroqClient() {
  if (!_groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key || key === 'mock_key' || !key.trim()) {
      return null; // Not configured — skip
    }
    _groqClient = new Groq({ apiKey: key });
    console.log('[PROVIDER] Groq client initialized.');
  }
  return _groqClient;
}

// ─── Language auto-detection from message text ────────────────────────────────
function detectLanguage(text) {
  const teluguChars = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
  const hindiChars  = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (teluguChars > 0) return { code: 'te', name: 'Telugu' };
  if (hindiChars  > 0) return { code: 'hi', name: 'Hindi' };
  return { code: 'en', name: 'English' };
}

// ─── Gemini message format ────────────────────────────────────────────────────
function toGeminiContents(messages) {
  let systemInstruction = '';
  const contents = [];
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction += msg.content + '\n';
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }
  return { systemInstruction: systemInstruction.trim(), contents };
}

// ─── Classify whether an error is a hard provider failure (triggers failover) ─
function isFailoverError(err) {
  const msg    = (err?.message || String(err)).toLowerCase();
  const status = err?.status || err?.statusCode || err?.response?.status;

  return (
    status === 429                         || // Rate limit / quota
    status === 503                         || // Service unavailable
    status === 502                         || // Bad gateway
    status === 504                         || // Gateway timeout
    msg.includes('quota')                  ||
    msg.includes('rate limit')             ||
    msg.includes('too many requests')      ||
    msg.includes('resource_exhausted')     ||
    msg.includes('resource exhausted')     ||
    msg.includes('service unavailable')    ||
    msg.includes('overloaded')             ||
    msg.includes('capacity')              ||
    msg.includes('timeout')               ||
    msg.includes('network')               ||
    msg.includes('econnreset')            ||
    msg.includes('enotfound')             ||
    msg.includes('socket hang up')
  );
}

// ─── Exponential backoff helper ───────────────────────────────────────────────
async function backoff(attempt) {
  // attempt 1 → 0ms, attempt 2 → 2000ms, attempt 3 → 4000ms
  const ms = attempt <= 1 ? 0 : (attempt - 1) * 2000;
  if (ms > 0) {
    console.log(`[FAILOVER] Waiting ${ms}ms before next attempt...`);
    await new Promise(r => setTimeout(r, ms));
  }
}

// ─── Single-provider caller (one attempt) ─────────────────────────────────────
async function callProvider(providerName, modelName, messages, expectJson) {
  const geminiKeyPresent = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'mock_key' && process.env.GEMINI_API_KEY.trim() !== '' ? 'Yes' : 'No';
  const groqKeyPresent = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'mock_key' && process.env.GROQ_API_KEY.trim() !== '' ? 'Yes' : 'No';

  console.log('\n--- PROVIDER CALL DIAGNOSTIC ---');
  console.log(`Loaded Provider: ${providerName}`);
  console.log(`Gemini Key Present: ${geminiKeyPresent}`);
  console.log(`Groq Key Present: ${groqKeyPresent}`);
  console.log(`Selected Model: ${modelName}`);

  if (providerName === 'gemini') {
    const client = getGeminiClient();
    if (!client) {
      console.log('HTTP Status: Config Error');
      console.log('Raw Provider Response: (Gemini key not configured)');
      console.log('--------------------------------');
      throw new Error('AI_NOT_CONFIGURED: GEMINI_API_KEY missing or invalid.');
    }

    try {
      const { systemInstruction, contents } = toGeminiContents(messages);
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          temperature: 0.3,
          ...(expectJson ? { responseMimeType: 'application/json' } : {})
        }
      });
      const result = await model.generateContent({ contents });
      const text = result.response.text().trim();
      if (!text) throw new Error('Empty response from Gemini');
      
      console.log('HTTP Status: 200');
      console.log(`Raw Provider Response: ${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}`);
      console.log('--------------------------------');
      return text;
    } catch (err) {
      const status = err?.status || err?.statusCode || err?.response?.status || 'Unknown';
      console.log(`HTTP Status: ${status}`);
      console.log(`Raw Provider Response: (failed with error: ${err.message})`);
      console.log('--------------------------------');
      throw err;
    }
  }

  if (providerName === 'openai') {
    const client = getOpenAiClient();
    if (!client) {
      console.log('HTTP Status: Config Error');
      console.log('Raw Provider Response: (OpenAI key not configured)');
      console.log('--------------------------------');
      throw new Error('AI_NOT_CONFIGURED: OPENAI_API_KEY missing or invalid.');
    }

    try {
      const completion = await client.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.3,
        response_format: expectJson ? { type: 'json_object' } : undefined
      });
      const text = completion.choices[0].message.content.trim();
      const tokens = completion.usage?.total_tokens;
      if (tokens) console.log(`[PROVIDER] OpenAI token usage: ${tokens}`);
      if (!text) throw new Error('Empty response from OpenAI');

      console.log('HTTP Status: 200');
      console.log(`Raw Provider Response: ${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}`);
      console.log('--------------------------------');
      return text;
    } catch (err) {
      const status = err?.status || err?.statusCode || 'Unknown';
      console.log(`HTTP Status: ${status}`);
      console.log(`Raw Provider Response: (failed with error: ${err.message})`);
      console.log('--------------------------------');
      throw err;
    }
  }

  if (providerName === 'groq') {
    const client = getGroqClient();
    if (!client) {
      console.log('HTTP Status: Config Error');
      console.log('Raw Provider Response: (Groq key not configured)');
      console.log('--------------------------------');
      throw new Error('AI_NOT_CONFIGURED: GROQ_API_KEY missing or invalid.');
    }

    let currentModel = modelName;
    let fallbackAttempted = false;

    while (true) {
      try {
        if (fallbackAttempted) {
          console.log(`Retrying Groq Call with Model: ${currentModel}`);
        }
        const completion = await client.chat.completions.create({
          model: currentModel,
          messages,
          temperature: 0.3,
          max_tokens: 1500,
          response_format: expectJson ? { type: 'json_object' } : undefined
        });
        const text = completion.choices[0].message.content.trim();
        if (!text) throw new Error('Empty response from Groq');

        console.log('HTTP Status: 200');
        console.log(`Raw Provider Response: ${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}`);
        console.log('--------------------------------');
        return text;
      } catch (err) {
        const reason = (err?.message || String(err)).toLowerCase();
        const isInvalidModel = reason.includes('decommissioned') ||
                               reason.includes('no longer supported') ||
                               reason.includes('does not exist') ||
                               reason.includes('not exist') ||
                               reason.includes('unknown model') ||
                               reason.includes('invalid model') ||
                               reason.includes('not_found') ||
                               reason.includes('model_not_found');

        if (isInvalidModel && !fallbackAttempted) {
          console.warn(`[AI SERVICE] Model "${currentModel}" is invalid or decommissioned. Auto-replacing...`);
          currentModel = currentModel === 'llama-3.1-8b-instant'
            ? 'meta-llama/llama-4-scout-17b-16e-instruct'
            : 'llama-3.1-8b-instant';
          console.warn(`[AI SERVICE] Auto-selected fallback model: ${currentModel}`);
          fallbackAttempted = true;
          continue;
        }

        const status = err?.status || err?.statusCode || 'Unknown';
        console.log(`HTTP Status: ${status}`);
        console.log(`Raw Provider Response: (failed with error: ${err.message})`);
        console.log('--------------------------------');
        throw err;
      }
    }
  }

  throw new Error(`Unknown provider: ${providerName}`);
}

// ─── Provider chain with automatic failover ───────────────────────────────────
//
//  Execution order:
//    1. Gemini (Primary) - Attempt 1 (immediate), Attempt 2 (wait 2s)
//    2. Groq   (Fallback) - Attempt 3 (wait 4s), Attempt 4 (wait 6s)
//
//  Failover/retry triggers on: 429, quota, rate-limit, timeout, resource exhausted,
//  provider unavailable, network, or empty response.
// ─────────────────────────────────────────────────────────────────────────────
async function callLlmProvider(messages, expectJson = false) {
  const providers = [
    { name: 'gemini', model: process.env.AI_MODEL || 'gemini-2.5-flash' },
    { name: 'groq',   model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant' }
  ];

  const globalStart = Date.now();
  let lastError = null;

  // ── Try Gemini (Attempt 1 & 2) ──────────────────────────────────────────────
  const geminiProvider = providers[0];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const globalAttempt = attempt;
    
    // Backoff timing
    if (globalAttempt === 2) {
      console.log('[FAILOVER] Waiting 2 seconds before retrying Gemini...');
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[AI REQUEST] Attempt ${globalAttempt}/4 | Provider: gemini | Model: ${geminiProvider.model}`);

    try {
      // Simulate Gemini quota error if requested by environment variable
      if (process.env.SIMULATE_GEMINI_QUOTA === 'true') {
        throw new Error('GoogleGenerativeAI Error: [429 Too Many Requests] Quota exceeded for model gemini-2.5-flash');
      }

      const content = await callProvider('gemini', geminiProvider.model, messages, expectJson);
      const elapsed = Date.now() - globalStart;
      console.log(`[AI RESPONSE] Execution time: ${elapsed}ms`);
      
      if (globalAttempt > 1) {
        console.log('[FAILOVER] ✅ Succeeded with provider: gemini on retry');
      }
      return content;

    } catch (err) {
      lastError = err;
      console.error(`[AI ERROR] Gemini attempt ${attempt} failed. Complete stack trace:`);
      console.error(err.stack || err);
      
      const reason = err?.message || String(err);
      const shouldFailover = isFailoverError(err) || reason.includes('AI_NOT_CONFIGURED') || reason.includes('Empty response');
      if (!shouldFailover) {
        console.error(`[AI ERROR] Hard error on Gemini: ${reason}`);
      }
    }
  }

  // ── Switch to Groq (Attempt 3 & 4) ──────────────────────────────────────────
  console.log(`\n[FAILOVER] ❌ GEMINI FAILED`);
  console.log(`[FAILOVER] Switching to GROQ...\n`);

  const groqProvider = providers[1];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const globalAttempt = attempt + 2;

    // Backoff timing
    if (globalAttempt === 3) {
      console.log('[FAILOVER] Waiting 4 seconds before trying Groq...');
      await new Promise(r => setTimeout(r, 4000));
    } else if (globalAttempt === 4) {
      console.log('[FAILOVER] Waiting 6 seconds before retrying Groq...');
      await new Promise(r => setTimeout(r, 6000));
    }

    console.log(`[AI REQUEST] Attempt ${globalAttempt}/4 | Provider: groq | Model: ${groqProvider.model}`);

    try {
      const content = await callProvider('groq', groqProvider.model, messages, expectJson);
      const elapsed = Date.now() - globalStart;
      console.log(`[AI RESPONSE] Execution time: ${elapsed}ms`);
      console.log(`[FAILOVER] ✅ Succeeded with provider: groq`);
      return content;

    } catch (err) {
      lastError = err;
      console.error(`[AI ERROR] Groq attempt ${attempt} failed. Complete stack trace:`);
      console.error(err.stack || err);
      if (err && typeof err === 'object') {
        console.error('Groq SDK full error details:', JSON.stringify(err, null, 2));
      }
    }
  }

  // Both providers exhausted
  console.error('[FAILOVER] ALL providers failed. Last error:', lastError?.stack || lastError?.message || lastError);
  throw lastError || new Error('All AI providers are currently unavailable.');
}



// ─── System Prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(detectedLangName, fallbackLangName) {
  return `You are Nyaya Copilot, an expert Indian Legal AI Assistant built into the Nyaya Setu legal platform.

IDENTITY RULES:
- Your name is "Nyaya Copilot". NEVER reveal that you are Gemini, OpenAI, or any other AI model.
- If asked who you are, say you are "Nyaya Copilot by Nyaya Setu".

CRITICAL LANGUAGE RULE:
- Detect the language of the USER'S message automatically by reading the script of their text.
- If the user writes in Telugu script (like హలో, నమస్కారం), respond ENTIRELY in Telugu.
- If the user writes in Hindi/Devanagari script (like नमस्ते, मेरी समस्या), respond ENTIRELY in Hindi.
- If the user writes in English, respond in English.
- NEVER mix languages in a single response.
- Use natural, conversational Telugu/Hindi — not machine-translated language.
- The detected language for this message is: ${detectedLangName} (UI preference: ${fallbackLangName}).

CONVERSATIONAL STYLE — MOST IMPORTANT RULE:
- Write the "reply" field EXACTLY like a warm, experienced lawyer speaking directly to a worried client.
- The reply must be flowing, natural prose — multiple connected paragraphs.
- NEVER start with section headings like "Legal Category:", "Applicable Laws:", "Documents:", "Roadmap:".
- NEVER use markdown headings (## or #) inside the reply field.
- NEVER use bullet points (- or *) inside the reply field.
- NEVER write documentation-style or structured content inside reply.
- Start by acknowledging their situation empathetically, then explain what legal options exist, then guide next steps — all in natural speech.

GOOD REPLY EXAMPLE (English):
"I completely understand how distressing this situation must be for you. What you're describing — your neighbour creating excessive noise every night — is a clear case of noise pollution and public nuisance under Indian law, and you absolutely have legal remedies available. The first practical step is to start documenting everything: make audio or video recordings of the noise, and keep a written log with dates and times. This documentation becomes your strongest evidence. From there, you can file a complaint at your local police station, which has the authority to act under the Noise Pollution Rules 2000 and Section 268 of the IPC. If the police response is inadequate, the next step would be approaching the Sub-Divisional Magistrate or your municipal authority. In cases where the problem persists, a civil court can grant an injunction ordering your neighbour to stop. I recommend consulting a criminal or civil lawyer who can draft a proper legal notice first — that alone often resolves these disputes quickly. I have put together the key documents you will need and a step-by-step roadmap for you."

GOOD REPLY EXAMPLE (Telugu):
"మీరు చెప్పింది విన్నాను, ఇది నిజంగా చాలా ఇబ్బందికరంగా ఉంటుంది. రాత్రిపూట పొరుగువారి శబ్దం వల్ల మీ నిద్ర పాడవుతోందంటే, ఇది చట్టపరంగా శబ్ద కాలుష్యం మరియు పొరుగు ఇబ్బంది కింద వస్తుంది — మీకు చట్టం మద్దతిస్తుంది. మొదట శబ్దాన్ని వీడియో లేదా ఆడియో రికార్డ్ చేసి, రోజువారీ తేదీలు, సమయాలు రాసుకోండి. ఇది మీ ముఖ్యమైన సాక్ష్యం అవుతుంది. ఆ తర్వాత స్థానిక పోలీస్ స్టేషన్‌లో ఫిర్యాదు చేయవచ్చు. పోలీసులు పట్టించుకోకపోతే, సబ్ డివిజనల్ మేజిస్ట్రేట్ దగ్గర లేదా మున్సిపాలిటీలో ఫిర్యాదు చేయవచ్చు. సమస్య కొనసాగితే సివిల్ కోర్టు ద్వారా ఇంజంక్షన్ కూడా పొందవచ్చు. ముందుగా ఒక న్యాయవాది ద్వారా లీగల్ నోటీస్ పంపించడం చాలాసార్లు వేగంగా పని చేస్తుంది. మీకు అవసరమైన పత్రాలు మరియు దశలు కింద చూపిస్తున్నాను."

BEHAVIOR:
- Be warm, empathetic, and professional.
- Explain legal concepts in simple language a rural citizen can understand.
- NEVER hallucinate laws. Only cite well-known Indian laws (IPC, BNS, CPC, CrPC, specific Acts).
- NEVER predict court outcomes or guarantee results.
- ALWAYS recommend consulting a licensed advocate for final legal action.
- Focus ONLY on the current user message. Do not confuse it with previous conversations.
- For greetings ("Hello", "హలో", "नमस्ते"): reply warmly in natural prose, explain what Nyaya Copilot does. Set category to "General Inquiry", leave laws/roadmap as empty arrays [].
- For sensitive topics (domestic violence, divorce, harassment): be especially empathetic and supportive.

JSON OUTPUT — STRICT CONTRACT (valid JSON only, no markdown fences, no text outside the JSON):
{
  "success": true,
  "reply": "Conversational flowing paragraphs. NO headings. NO bullet points. NO markdown symbols like ## or **. Warm natural prose like a lawyer speaking to a client. Never a list. Never a heading. Must address the exact issue asked. NEVER empty.",
  "category": "Short legal category label in detected language",
  "laws": ["IPC Section X – explanation", "Relevant Act – provision"],
  "suggested_actions": ["Immediate action 1", "Immediate action 2", "Immediate action 3", "Immediate action 4", "Immediate action 5"],
  "roadmap": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."],
  "requiredDocuments": ["Document 1", "Document 2", "Document 3", "Document 4"],
  "advocateType": "Type of lawyer recommended in detected language",
  "estimatedTimeline": "e.g. 3–6 months",
  "estimatedFee": "₹X,XXX – ₹XX,XXX",
  "confidence": 0.95,
  "disclaimer": "Disclaimer in detected language"
}

FIELD CONTRACT:
- "reply": Conversational paragraphs ONLY. NEVER put headings, bullets, or structured lists here. This is what the user reads in the chat bubble.
- "laws": Separate structured array. Put all law citations here, not in reply.
- "roadmap": Separate array of 5 steps. Put the step-by-step plan here, not in reply.
- "requiredDocuments": Separate array. Put document lists here, not in reply.
- "reply" must address the EXACT question asked. Do not answer a different legal topic.
- For greetings: "laws", "roadmap", "requiredDocuments", "suggested_actions" should all be [].`;
}

// ─── Main export: analyzeProblem ─────────────────────────────────────────────
export async function analyzeProblem(problem, language = 'en', history = [], requestId = '') {
  // Auto-detect language from the actual message text (overrides UI param)
  const detected = detectLanguage(problem);
  const fallbackLangName = language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English';

  console.log(`\n[AI SERVICE] RequestID: ${requestId}`);
  console.log(`[AI SERVICE] User message: "${problem}"`);
  console.log(`[AI SERVICE] Detected language: ${detected.name} (UI setting: ${fallbackLangName})`);
  console.log(`[AI SERVICE] History entries: ${history.length}`);

  const systemPrompt = buildSystemPrompt(detected.name, fallbackLangName);

  // ── Build messages — ONLY keep last 3 exchanges to avoid context pollution ──
  const messages = [{ role: 'system', content: systemPrompt }];

  // Limit history to last 1 pair (2 messages) to prevent token limits (Telugu is very token-heavy)
  const recentHistory = history.slice(-2);
  if (recentHistory.length > 0) {
    console.log(`[AI SERVICE] Injecting ${recentHistory.length} history messages`);
    for (const h of recentHistory) {
      if (h.role && h.content && h.content.trim()) {
        messages.push({ role: h.role, content: h.content });
      }
    }
  }

  // ── Language enforcement reminder (overrides any language drift from history) ─
  // This is critical when Groq sees multilingual history and wrongly inherits it.
  const langReminder = detected.code === 'te'
    ? 'CRITICAL REMINDER: The user\'s current message is in TELUGU. You MUST respond ONLY in Telugu. Do NOT switch to English or Hindi under any circumstances.'
    : detected.code === 'hi'
    ? 'CRITICAL REMINDER: The user\'s current message is in HINDI. You MUST respond ONLY in Hindi. Do NOT switch to English or Telugu under any circumstances.'
    : 'CRITICAL REMINDER: The user\'s current message is in ENGLISH. You MUST respond ONLY in English. Do NOT use Telugu, Hindi, or any other language in your reply.';

  messages.push({ role: 'system', content: langReminder });

  // The current user message is ALWAYS the final message
  messages.push({ role: 'user', content: problem });

  const promptLength = messages.reduce((acc, m) => acc + m.content.length, 0);
  console.log(`[AI SERVICE] Total prompt length: ${promptLength} chars`);
  console.log(`[AI SERVICE] Final user message (last): "${messages[messages.length - 1].content}"`);

  const raw = await callLlmProvider(messages, true);

  // Strip markdown code fences if model wraps JSON
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('[AI ERROR] JSON parse failed!');
    console.error('Raw response content was:', raw);
    console.error(e.stack || e);
    // Model returned plain text instead of JSON — wrap it gracefully
    parsed = {
      success: true,
      reply: raw,
      category: 'Legal Inquiry',
      explanation: raw,
      suggested_actions: ['Consult a licensed advocate for detailed guidance'],
      recommended_specialization: 'General Practice Lawyer',
      estimated_documents: ['Identity proof', 'Relevant agreements or notices'],
      requiredDocuments: ['Identity proof', 'Relevant agreements or notices'],
      nextSteps: ['Consult an advocate'],
      roadmap: ['Gather documents', 'Consult advocate', 'Send legal notice', 'File complaint', 'Follow up'],
      estimatedFee: '₹1,000 - ₹5,000',
      estimatedTimeline: 'Varies by case',
      advocateType: 'General Practice Lawyer',
      confidence: 0.8,
      disclaimer: 'This information is for educational purposes only. Please consult a licensed advocate before taking legal action.'
    };
  }

  // Safety: ensure confidence exists
  if (typeof parsed.confidence !== 'number') parsed.confidence = 0.95;

  // Safety: reply must never be empty
  if (!parsed.reply || parsed.reply.trim() === '') {
    parsed.reply = parsed.explanation || 'I understand your situation. Please describe more details so I can guide you better.';
  }

  // Add detected language to response for frontend awareness
  parsed.detectedLanguage = detected.code;
  parsed.requestId = requestId;

  console.log(`[AI SERVICE] Response category: ${parsed.category} | Confidence: ${parsed.confidence} | Language: ${detected.name}`);
  return parsed;
}

// ─── Document checker ─────────────────────────────────────────────────────────
export async function checkDocument(fileName, fileType, textContent, language = 'en') {
  const langName = language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English';
  const messages = [
    {
      role: 'system',
      content: `You are Nyaya Copilot. Analyze the legal document titled "${fileName}" (${fileType}).
Text: "${textContent.substring(0, 3000)}"
Respond in ${langName} in strict JSON:
{
  "summary": "Plain language summary",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "difficultWords": { "term": "explanation" },
  "missingDocuments": ["Doc 1", "Doc 2"]
}`
    },
    { role: 'user', content: 'Analyze this document.' }
  ];

  const raw = await callLlmProvider(messages, true);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

// ─── Hearing explainer ────────────────────────────────────────────────────────
export async function explainHearing(legaleseText, language = 'en') {
  const langName = language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English';
  const messages = [
    {
      role: 'system',
      content: `You are Nyaya Copilot. Translate this court order into simple ${langName} language that any citizen can understand. Be concise and clear.`
    },
    { role: 'user', content: legaleseText }
  ];
  return await callLlmProvider(messages, false);
}

// ─── What-next projector ──────────────────────────────────────────────────────
export async function explainWhatNext(caseTitle, currentStatus, language = 'en') {
  const langName = language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English';
  const messages = [
    {
      role: 'system',
      content: `You are Nyaya Copilot. Explain the next legal stages for this Indian court case in ${langName}.
Case: "${caseTitle}", Status: "${currentStatus}".
Respond in strict JSON: { "currentStage": "...", "possibleNextStage": "...", "documentsToPrepare": [], "waitingTime": "..." }`
    },
    { role: 'user', content: `What happens next for: ${caseTitle}?` }
  ];

  const raw = await callLlmProvider(messages, true);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}
