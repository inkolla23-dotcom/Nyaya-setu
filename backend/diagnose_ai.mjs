/**
 * NYAYA SETU — COMPLETE BACKEND AI DIAGNOSTIC
 * Run: node diagnose_ai.mjs
 */

import dotenv from 'dotenv';
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY   = process.env.GROQ_API_KEY;
const AI_MODEL   = process.env.AI_MODEL   || 'gemini-2.5-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const BACKEND_URL = 'http://localhost:5000/api';

const GROQ_FALLBACK_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

function section(title) {
  console.log('\n' + '='.repeat(60));
  console.log('  ' + title);
  console.log('='.repeat(60));
}
function ok(l, v)   { console.log(`  OK  ${l}: ${v}`); }
function fail(l, v) { console.log(`  FAIL ${l}: ${v}`); }
function info(l, v) { console.log(`  INFO ${l}: ${v}`); }

// STEP 1 - Env
section('STEP 1 - Environment Variables');
info('AI_PROVIDER',  process.env.AI_PROVIDER || '(not set)');
info('AI_MODEL',     AI_MODEL);
info('GROQ_MODEL',   GROQ_MODEL);
(GEMINI_KEY && GEMINI_KEY !== 'mock_key') ? ok('GEMINI_API_KEY','Present (' + GEMINI_KEY.substring(0,8) + '...)') : fail('GEMINI_API_KEY','MISSING or mock_key');
(GROQ_KEY && GROQ_KEY !== 'mock_key')     ? ok('GROQ_API_KEY',  'Present (' + GROQ_KEY.substring(0,12) + '...)') : fail('GROQ_API_KEY','MISSING or mock_key');

// STEP 2 - Gemini
section('STEP 2 - Gemini Direct Test');
async function testGemini(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  console.log('  Calling: ' + url.replace(GEMINI_KEY, '[KEY]'));
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say HELLO' }] }], generationConfig: { maxOutputTokens: 20 } }),
      signal: AbortSignal.timeout(30000)
    });
    const elapsed = Date.now() - start;
    const data = await res.json();
    info('HTTP Status', res.status);
    if (res.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '(no text)';
      ok('Gemini Reply', text.substring(0, 80));
      ok('Time', elapsed + 'ms');
      return true;
    } else {
      fail('Gemini Error Code', data.error?.status || res.status);
      fail('Gemini Error Message', (data.error?.message || '').substring(0, 200));
      console.log('\n  FULL ERROR:');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (e) {
    fail('Gemini EXCEPTION', e.message);
    console.error(e.stack);
    return false;
  }
}
const geminiOk = await testGemini(AI_MODEL);

// STEP 3 - Groq Model Probe
section('STEP 3 - Groq Model Availability Probe');
async function testGroqModel(model) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Say HELLO' }], max_tokens: 20 }),
      signal: AbortSignal.timeout(30000)
    });
    const elapsed = Date.now() - start;
    const data = await res.json();
    if (res.ok) {
      const text = data.choices?.[0]?.message?.content || '(no text)';
      ok(model, 'HTTP ' + res.status + ' | ' + elapsed + 'ms | "' + text.trim().substring(0,60) + '"');
      return { ok: true, model };
    } else {
      const errMsg = data.error?.message || JSON.stringify(data);
      fail(model, 'HTTP ' + res.status + ' - ' + errMsg.substring(0, 150));
      return { ok: false, model, error: errMsg };
    }
  } catch (e) {
    fail(model, 'EXCEPTION - ' + e.message);
    return { ok: false, model, error: e.message };
  }
}
console.log('  Testing configured GROQ_MODEL = "' + GROQ_MODEL + '"');
const configuredResult = await testGroqModel(GROQ_MODEL);
let workingGroqModel = configuredResult.ok ? GROQ_MODEL : null;
if (!configuredResult.ok) {
  console.log('\n  Configured model failed. Probing fallbacks...\n');
  for (const m of GROQ_FALLBACK_MODELS) {
    if (m === GROQ_MODEL) continue;
    const r = await testGroqModel(m);
    if (r.ok) { workingGroqModel = m; break; }
  }
}
if (workingGroqModel) {
  ok('Best working Groq model', workingGroqModel);
  if (workingGroqModel !== GROQ_MODEL) {
    console.log('\n  WARNING: GROQ_MODEL in .env ("' + GROQ_MODEL + '") is NOT working.');
    console.log('  FIX: Set GROQ_MODEL=' + workingGroqModel + ' in backend/.env and restart backend.');
  }
} else {
  fail('Groq', 'ALL probed models failed');
}

// STEP 4 - Groq JSON Test
section('STEP 4 - Groq Full JSON Mode Test');
if (workingGroqModel) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: workingGroqModel,
        messages: [{ role: 'system', content: 'Respond in JSON: {"reply":"...", "category":"..."}' }, { role: 'user', content: 'Hello' }],
        max_tokens: 300,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(30000)
    });
    const elapsed = Date.now() - start;
    const raw = await res.text();
    info('HTTP Status', res.status);
    info('Time', elapsed + 'ms');
    console.log('\n  RAW RESPONSE (first 600 chars):');
    console.log('  ' + raw.substring(0, 600));
    if (res.ok) {
      const data = JSON.parse(raw);
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          ok('JSON Parse', 'SUCCESS');
          ok('reply', (parsed.reply || '').substring(0, 80));
        } catch (e) { fail('JSON Parse', e.message + ' | content: ' + content.substring(0,200)); }
      } else { fail('No content in choices', JSON.stringify(data).substring(0, 200)); }
    } else { fail('HTTP Error', res.status); }
  } catch (e) {
    fail('EXCEPTION', e.message);
    console.error(e.stack);
  }
} else { info('STEP 4', 'Skipped - no working Groq model'); }

// STEP 5 - E2E through backend
section('STEP 5 - E2E Backend API Test (POST /copilot/chat with "Hello")');
async function loginAndGetToken() {
  try {
    const res = await fetch(BACKEND_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test1234', role: 'client' }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json();
    return data.token || null;
  } catch (e) { return null; }
}
const token = await loginAndGetToken();
if (!token) {
  fail('Login', 'Could not get auth token - is backend running on port 5000?');
} else {
  ok('Login', 'Token acquired');
  const start = Date.now();
  try {
    const res = await fetch(BACKEND_URL + '/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ message: 'Hello', language: 'en' }),
      signal: AbortSignal.timeout(120000)
    });
    const elapsed = Date.now() - start;
    const data = await res.json();
    info('HTTP Status', res.status);
    info('Time', elapsed + 'ms');
    if (data.success) {
      ok('AI Reply', (data.reply || '').substring(0, 150));
      ok('Category', data.category || '(none)');
    } else {
      fail('E2E FAILED', data.error || JSON.stringify(data));
      console.log('\n  FULL API RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    fail('E2E EXCEPTION', e.message);
    console.error(e.stack);
  }
}

// Summary
section('SUMMARY');
geminiOk        ? ok('Gemini', 'Working') : fail('Gemini', 'Down (quota exceeded or invalid key)');
workingGroqModel ? ok('Groq', 'Working model: ' + workingGroqModel) : fail('Groq', 'No working model');
if (!geminiOk && !workingGroqModel) {
  console.log('\n  BOTH providers are down => fallback message shown to user.');
  console.log('  => Wait for Gemini quota reset or upgrade Groq at https://console.groq.com');
} else if (!geminiOk && workingGroqModel) {
  console.log('\n  Gemini down but Groq working => failover should be active.');
  console.log('  => Set GROQ_MODEL=' + workingGroqModel + ' in backend/.env and restart backend.');
} else {
  console.log('\n  Gemini is working. Primary provider should serve all requests.');
}
console.log('\n' + '='.repeat(60) + '\n');
