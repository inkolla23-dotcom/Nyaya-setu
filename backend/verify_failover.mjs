import dotenv from 'dotenv';
dotenv.config();
import { analyzeProblem } from './services/aiService.js';

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

async function run() {
  console.log(BOLD('=== NYAYA COPILOT PROVIDER FAILOVER VERIFICATION ==='));

  // Test 1: Normal call (Gemini should succeed if key is valid and not rate-limited)
  console.log(BOLD('\n[Step 1] Normal flow (Gemini)'));
  process.env.SIMULATE_GEMINI_QUOTA = 'false';
  let normalResponse;
  try {
    normalResponse = await analyzeProblem('Hi, I have a neighbour dispute.', 'en', [], 'verify-normal');
    assert(normalResponse.success === true, 'Gemini responds successfully');
    assert(typeof normalResponse.reply === 'string' && normalResponse.reply.length > 0, 'Gemini reply is valid');
    assert(Array.isArray(normalResponse.laws), 'Gemini response has laws array');
    console.log(YELLOW(`  Gemini Response Preview: "${normalResponse.reply.substring(0, 100)}..."`));
  } catch (e) {
    console.log(YELLOW(`  ⚠️  Gemini call failed/rate-limited: ${e.message}. Proceeding to failover test.`));
  }

  // Test 2: Failover call (Gemini quota error simulation)
  console.log(BOLD('\n[Step 2] Failover flow (Simulated Gemini Quota Error -> Groq Fallback)'));
  process.env.SIMULATE_GEMINI_QUOTA = 'true';
  let failoverResponse;
  try {
    failoverResponse = await analyzeProblem('Hi, I have a neighbour dispute.', 'en', [], 'verify-failover');
    assert(failoverResponse.success === true, 'Groq fallback responds successfully');
    assert(typeof failoverResponse.reply === 'string' && failoverResponse.reply.length > 0, 'Groq reply is valid');
    assert(Array.isArray(failoverResponse.laws), 'Groq response has laws array');
    assert(Array.isArray(failoverResponse.roadmap) && failoverResponse.roadmap.length > 0, 'Groq response has roadmap array');
    console.log(YELLOW(`  Groq Response Preview: "${failoverResponse.reply.substring(0, 100)}..."`));
  } catch (e) {
    console.error(RED(`  ❌ Failover to Groq failed: ${e.message}`));
    failed++;
  }

  // Test 3: JSON response schema comparison
  console.log(BOLD('\n[Step 3] Response Schema Comparison'));
  if (normalResponse && failoverResponse) {
    const normalKeys = Object.keys(normalResponse).sort();
    const failoverKeys = Object.keys(failoverResponse).sort();
    const match = JSON.stringify(normalKeys) === JSON.stringify(failoverKeys);
    assert(match, 'JSON schemas are identical between Gemini and Groq', `Gemini: [${normalKeys}], Groq: [${failoverKeys}]`);
  } else if (failoverResponse) {
    // Check key fields on Groq response
    const requiredKeys = ['success', 'reply', 'category', 'laws', 'suggested_actions', 'roadmap', 'requiredDocuments', 'advocateType', 'estimatedTimeline', 'estimatedFee', 'confidence', 'disclaimer'];
    let allExist = true;
    for (const key of requiredKeys) {
      if (failoverResponse[key] === undefined) {
        allExist = false;
        console.log(RED(`  ❌ Missing key in Groq response: ${key}`));
      }
    }
    assert(allExist, 'Groq response matches the required legal analysis JSON schema');
  } else {
    assert(false, 'Unable to compare schemas (both calls failed)');
  }

  console.log(`\n${'═'.repeat(50)}`);
  if (failed === 0) {
    console.log(GREEN(`🎉 VERIFICATION SUCCESSFUL: ${passed} assertions passed.`));
  } else {
    console.log(RED(`⚠️ VERIFICATION FAILED: ${failed} assertions failed.`));
    process.exit(1);
  }
}

run().catch(err => {
  console.error(RED(`Fatal error: ${err.message}`));
  process.exit(1);
});
