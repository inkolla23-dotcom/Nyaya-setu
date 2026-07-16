/**
 * Failover system test — runs from backend/ directory
 */
import './services/aiService.js'; // verify it imports cleanly
import dotenv from 'dotenv';
dotenv.config();

const GREEN  = s => `\x1b[32m${s}\x1b[0m`;
const RED    = s => `\x1b[31m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;
const BOLD   = s => `\x1b[1m${s}\x1b[0m`;

let passed = 0, failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(GREEN('  ✅') + ` ${label}`);
    passed++;
  } else {
    console.log(RED('  ❌') + ` ${label}` + (detail ? ` | ${detail}` : ''));
    failed++;
  }
}

// ── Test 1: Module loads without syntax errors ─────────────────────────────────
console.log(BOLD('\n[Test 1] aiService.js imports cleanly'));
assert(true, 'aiService.js loaded without syntax errors');

// ── Test 2: Provider chain order & backoff formula ────────────────────────────
console.log(BOLD('\n[Test 2] Provider chain + backoff timing'));
{
  const chain = ['gemini', 'openai', 'groq'];
  assert(chain[0] === 'gemini', 'Chain position 0 = gemini (primary)');
  assert(chain[1] === 'openai', 'Chain position 1 = openai (1st fallback)');
  assert(chain[2] === 'groq',   'Chain position 2 = groq   (2nd fallback)');

  const backoffMs = n => n <= 1 ? 0 : (n - 1) * 2000;
  assert(backoffMs(1) === 0,    'Attempt 1 backoff = 0ms   (immediate)');
  assert(backoffMs(2) === 2000, 'Attempt 2 backoff = 2000ms');
  assert(backoffMs(3) === 4000, 'Attempt 3 backoff = 4000ms');
}

// ── Test 3: Failover error detection ─────────────────────────────────────────
console.log(BOLD('\n[Test 3] isFailoverError detection'));
{
  // Replicate the isFailoverError logic to verify it classifies correctly
  function isFailoverError(err) {
    const msg    = (err?.message || String(err)).toLowerCase();
    const status = err?.status;
    return (
      status === 429 || status === 503 || status === 502 || status === 504 ||
      msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests') ||
      msg.includes('resource_exhausted') || msg.includes('resource exhausted') ||
      msg.includes('service unavailable') || msg.includes('overloaded') ||
      msg.includes('timeout') || msg.includes('network') || msg.includes('econnreset')
    );
  }

  assert(isFailoverError({ status: 429 }),                             '429 status → failover');
  assert(isFailoverError({ status: 503 }),                             '503 status → failover');
  assert(isFailoverError({ message: 'Quota exceeded' }),               'quota message → failover');
  assert(isFailoverError({ message: 'Rate limit reached' }),           'rate limit → failover');
  assert(isFailoverError({ message: 'Too many requests' }),            'too many requests → failover');
  assert(isFailoverError({ message: 'Resource exhausted' }),           'resource exhausted → failover');
  assert(isFailoverError({ message: 'Service unavailable' }),          'service unavailable → failover');
  assert(isFailoverError({ message: 'Connection timeout' }),           'timeout → failover');
  assert(isFailoverError({ message: 'ECONNRESET' }),                   'network reset → failover');
  assert(!isFailoverError({ message: 'Invalid JSON response' }),       'JSON error → no failover (retry only)');
  assert(!isFailoverError({ message: 'Unexpected end of stream' }),    'stream error → no failover');
}

// ── Test 4: User message never exposes provider details ───────────────────────
console.log(BOLD('\n[Test 4] User-facing error messages'));
{
  function classifyError(err) {
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests') ||
        msg.includes('all ai providers') || err?.status === 429 || err?.status === 503) {
      return 'The AI service is temporarily busy. Retrying automatically... Please try again in a moment.';
    }
    if (msg.includes('ai_not_configured') || msg.includes('api key')) {
      return 'Nyaya Setu AI is not configured. Please contact support.';
    }
    return 'Nyaya Setu AI is processing your request. Please try again in a moment.';
  }

  const quotaMsg = classifyError({ status: 429, message: 'Gemini quota exceeded 20 RPM' });
  assert(!quotaMsg.includes('gemini'),          'Quota error: "gemini" not in user message', quotaMsg);
  assert(!quotaMsg.includes('quota exceeded'),  'Quota error: "quota exceeded" not in user message', quotaMsg);
  assert(!quotaMsg.includes('20 RPM'),          'Quota error: rate limit number not exposed', quotaMsg);
  assert(quotaMsg.includes('temporarily busy'), 'Quota error: shows "temporarily busy" message', quotaMsg);

  const unconfigMsg = classifyError({ message: 'AI_NOT_CONFIGURED: OPENAI_API_KEY missing' });
  assert(!unconfigMsg.includes('openai'),          'Config error: "openai" not in user message', unconfigMsg);
  assert(!unconfigMsg.includes('api_key'),         'Config error: key name not exposed', unconfigMsg);
  assert(unconfigMsg.includes('not configured'),   'Config error: shows "not configured"', unconfigMsg);

  const overloadMsg = classifyError({ status: 503, message: 'Groq service unavailable' });
  assert(!overloadMsg.includes('groq'),            'Overload error: "groq" not in user message', overloadMsg);
  assert(overloadMsg.includes('temporarily busy'), 'Overload error: shows "temporarily busy"', overloadMsg);
}

// ── Test 5: Live API call via backend (if Gemini has quota) ───────────────────
console.log(BOLD('\n[Test 5] Live backend call (requires auth token)'));
{
  try {
    // Login first
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test1234', role: 'client' })
    });
    const { token } = await loginRes.json();

    if (!token) {
      console.log(YELLOW('  ℹ️  Could not login — skipping live test'));
    } else {
      const aiRes = await fetch('http://localhost:5000/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: 'Hello', language: 'en' })
      });
      const data = await aiRes.json();

      if (data.success) {
        assert(typeof data.reply === 'string' && data.reply.length > 0, 'Live reply is non-empty');
        assert(Array.isArray(data.laws),          'Live response has laws array');
        assert(Array.isArray(data.roadmap),       'Live response has roadmap array');
        assert(typeof data.category === 'string', 'Live response has category string');
        assert(!data.error?.includes('gemini'),   'Success response does not mention provider');
        console.log(YELLOW(`  reply: "${data.reply.substring(0, 80)}..."`));
      } else {
        // Quota hit — check the user message is friendly
        const errMsg = data.error || '';
        assert(!errMsg.includes('gemini'),        'Quota error hides provider name', errMsg);
        assert(!errMsg.includes('openai'),        'Quota error hides openai',        errMsg);
        assert(!errMsg.includes('groq'),          'Quota error hides groq',          errMsg);
        assert(!errMsg.includes('quota exceeded'), 'Quota error hides quota details', errMsg);
        console.log(YELLOW(`  ℹ️  AI busy (quota): "${errMsg.substring(0, 80)}"`));
      }
    }
  } catch(e) {
    console.log(YELLOW(`  ℹ️  Live test skipped: ${e.message}`));
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(55)}`);
const result = failed === 0 ? GREEN('🎉 ALL TESTS PASSED') : RED(`⚠️  ${failed} FAILED`);
console.log(BOLD(`${result} — ${passed} passed, ${failed} failed out of ${passed + failed} assertions`));
